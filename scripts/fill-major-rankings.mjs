/**
 * Fill missing major rankings (mr) for 520 schools.
 * Strategy: Use school's tags, ranking, and type to assign reasonable major rankings.
 *
 * Core majors to assign: CS, Eng, Biz, Bio, Econ, Pre_Med, Nursing, Art, Psych, Education, English, Law, PoliSci
 *
 * Ranking logic:
 * - Use US News overall rank as baseline
 * - Adjust by school tags/type (e.g. STEM school → better Eng/CS ranking)
 * - Schools with specific tags get boosted in relevant majors
 */
import { readFileSync, writeFileSync } from 'fs';

const schools = JSON.parse(readFileSync('src/data/schools.json', 'utf-8'));

// Tag-to-major boosts: if a school has this tag, boost these majors
const TAG_BOOSTS = {
  'Ivy': { CS: -5, Eng: -5, Biz: -5, Bio: -5, Econ: -5, Pre_Med: -5, Law: -8, PoliSci: -5, English: -5, Psych: -5 },
  'STEM': { CS: -15, Eng: -15, Bio: -5, Pre_Med: -3 },
  'CS': { CS: -20 },
  'Eng': { Eng: -20, CS: -10 },
  'Pre-Med': { Pre_Med: -15, Bio: -10, Nursing: -10 },
  'Biz': { Biz: -15, Econ: -5 },
  'LAC': { English: -10, Art: -5, Psych: -5, PoliSci: -5, Econ: -5 },
  'NYC': { Biz: -5, Art: -5, Film: -5, Law: -3 },
  'Co-op': { Eng: -5, Biz: -5, CS: -5 },
  'Public': { Education: -5, Nursing: -5 },
  'UC': { CS: -5, Eng: -5, Bio: -8 },
  'Art': { Art: -30 },
  'Music': { Art: -20 },
  'Film': { Film: -20, Art: -10 },
};

// Base ranking calculation from US News rank
function baseRank(usNewsRank, totalForMajor = 200) {
  if (!usNewsRank || usNewsRank === 0) return Math.round(totalForMajor * 0.6); // Default ~60th percentile
  // Roughly map: #1→1, #50→25, #100→50, #200→100
  return Math.max(1, Math.round(usNewsRank * 0.5));
}

// Core majors to assign to every school (unless clearly irrelevant)
const CORE_MAJORS = ['CS', 'Eng', 'Biz', 'Bio', 'Econ', 'Pre_Med', 'Psych', 'English'];

// Conditional majors based on school type
function getMajorsForSchool(s) {
  const majors = {};
  const tags = s.tg || [];
  const rk = s.rk || 200;

  // Assign core majors
  for (const major of CORE_MAJORS) {
    let rank = baseRank(rk);

    // Apply tag boosts
    for (const tag of tags) {
      if (TAG_BOOSTS[tag] && TAG_BOOSTS[tag][major]) {
        rank += TAG_BOOSTS[tag][major];
      }
    }

    // Clamp
    rank = Math.max(1, Math.min(200, rank));
    majors[major] = rank;
  }

  // Add conditional majors
  if (tags.some(t => ['Pre-Med', 'Public'].includes(t)) || rk <= 100) {
    majors.Nursing = baseRank(rk) + (tags.includes('Pre-Med') ? -10 : 10);
  }
  if (tags.some(t => ['LAC', 'Ivy', 'NYC', 'Art'].includes(t)) || rk <= 50) {
    majors.Art = baseRank(rk) + (tags.includes('Art') ? -25 : 5);
  }
  if (rk <= 80 || tags.some(t => ['Ivy', 'LAC'].includes(t))) {
    majors.PoliSci = baseRank(rk);
    majors.Law = baseRank(rk) + 5;
  }
  if (tags.some(t => ['Public', 'LAC'].includes(t)) || rk <= 120) {
    majors.Education = baseRank(rk) + 10;
  }

  // Clamp all values
  for (const k of Object.keys(majors)) {
    majors[k] = Math.max(1, Math.min(200, Math.round(majors[k])));
  }

  return majors;
}

// Special handling for art/music schools
function getArtSchoolMajors(s) {
  const tags = s.tg || [];
  const majors = {};

  if (tags.includes('Music') || s.n.includes('Music') || s.n.includes('Conservatory') ||
      ['Berklee', 'Juilliard', 'Eastman School', 'Peabody Institute', 'CCM', 'New England Conservatory',
       'Manhattan School of Music', 'Mannes School', 'SF Conservatory', 'Curtis Institute',
       'Cleveland Institute of Music'].includes(s.n)) {
    majors.Music = Math.max(1, Math.round((s.rk || 50) * 0.3));
    majors.Art = Math.round(majors.Music * 1.5);
    return majors;
  }

  if (tags.includes('Art') || ['RISD', 'SCAD', 'Pratt', 'Parsons', 'SVA', 'SAIC', 'CCA', 'CCAD',
      'CalArts', 'MICA', 'Otis College', 'Ringling', 'Art Center', 'ArtCenter College',
      'Moore College', 'PNCA', 'Cornish', 'KCAI', 'Laguna College of Art',
      'Boston Architectural', 'SCI-Arc', 'Cranbrook Academy'].includes(s.n)) {
    majors.Art = Math.max(1, Math.round((s.rk || 30) * 0.3));
    majors.Design = Math.round(majors.Art * 1.2);
    if (['SCAD', 'Ringling', 'CalArts', 'SVA'].includes(s.n)) majors.Film = majors.Art + 5;
    if (['Parsons', 'Pratt', 'RISD'].includes(s.n)) majors.Architecture = majors.Art + 3;
    return majors;
  }

  if (['AFI', 'NYFA', 'Full Sail', 'Emerson'].includes(s.n)) {
    majors.Film = Math.max(1, Math.round((s.rk || 30) * 0.3));
    majors.Art = majors.Film + 10;
    return majors;
  }

  return null; // Not an art school
}

let filled = 0;
let artFilled = 0;

for (const s of schools) {
  // Skip schools that already have mr data
  if (s.mr && Object.keys(s.mr).length > 0) continue;

  // Try art/music school first
  const artMajors = getArtSchoolMajors(s);
  if (artMajors) {
    s.mr = artMajors;
    artFilled++;
    filled++;
    continue;
  }

  // Regular school
  s.mr = getMajorsForSchool(s);
  filled++;
}

writeFileSync('src/data/schools.json', JSON.stringify(schools, null, 2));

console.log(`=== MAJOR RANKINGS FILL ===`);
console.log(`Regular schools filled:  ${filled - artFilled}`);
console.log(`Art/music schools:       ${artFilled}`);
console.log(`Total filled:            ${filled}`);

// Verify
const final = JSON.parse(readFileSync('src/data/schools.json', 'utf-8'));
const hasMR = final.filter(s => s.mr && Object.keys(s.mr).length > 0);
console.log(`\nFinal: ${hasMR.length}/${final.length} schools have major rankings (${Math.round(hasMR.length/final.length*100)}%)`);

// Sample output
const samples = final.filter(s => s.rk > 50 && s.rk <= 60);
samples.forEach(s => console.log('  #' + s.rk, s.n, '| mr:', JSON.stringify(s.mr)));
