/**
 * Step 1: Replace estimated data with official College Scorecard data
 * Step 2: Fill missing SAT, tuition, GPA where possible
 */
import { readFileSync, writeFileSync } from 'fs';

const schools = JSON.parse(readFileSync('src/data/schools.json', 'utf-8'));

let stats = {
  rateFixed: 0,
  satFixed: 0,
  satDetailAdded: 0,
  tuitionFixed: 0,
  sizeFixed: 0,
  estCleared: 0,
  satFromAvg: 0,
};

for (const s of schools) {
  const sc = s.scorecard;
  if (!sc) continue;

  // --- 1. Fix acceptance rate from scorecard ---
  if (sc.admission_rate > 0) {
    const officialRate = Math.round(sc.admission_rate * 100 * 10) / 10; // e.g. 0.0462 → 4.6
    // Only replace if est=true or if current rate seems way off
    if (s.est) {
      s.r = officialRate;
      stats.rateFixed++;
    }
  }

  // --- 2. Fix SAT [0,0] from scorecard ---
  if (s.sat[0] === 0 && s.sat[1] === 0) {
    if (sc.sat_math_25 > 0 && sc.sat_reading_25 > 0) {
      // Combine math + reading for total SAT 25th/75th
      s.sat = [
        sc.sat_math_25 + sc.sat_reading_25,
        sc.sat_math_75 + sc.sat_reading_75
      ];
      stats.satFixed++;
    } else if (sc.sat_average > 0) {
      // Estimate 25th-75th from average (±60 typical range)
      s.sat = [
        Math.round(sc.sat_average - 60),
        Math.round(sc.sat_average + 60)
      ];
      stats.satFromAvg++;
    }
  }

  // --- 3. Improve SAT data for est=true schools ---
  if (s.est && sc.sat_math_25 > 0 && sc.sat_reading_25 > 0) {
    const total25 = sc.sat_math_25 + sc.sat_reading_25;
    const total75 = sc.sat_math_75 + sc.sat_reading_75;
    // Replace if significantly different (more accurate from scorecard)
    if (Math.abs(s.sat[0] - total25) > 30 || Math.abs(s.sat[1] - total75) > 30) {
      s.sat = [total25, total75];
      stats.satDetailAdded++;
    }
  }

  // --- 4. Fix missing tuition ---
  if ((!s.tuition || s.tuition === 0) && sc.tuition_out_of_state > 0) {
    s.tuition = sc.tuition_out_of_state;
    stats.tuitionFixed++;
  }

  // --- 5. Fix size from scorecard ---
  if ((!s.size || s.size === 0) && sc.student_size > 0) {
    s.size = sc.student_size;
    stats.sizeFixed++;
  }

  // --- 6. Clear est flag if we now have official data ---
  if (s.est && sc.admission_rate > 0 && (sc.sat_math_25 > 0 || sc.sat_average > 0)) {
    s.est = false;
    stats.estCleared++;
  }
}

// --- 7. Fill GPA=0 from SAT average (rough estimate: SAT-to-GPA heuristic) ---
// Only for schools that truly have no GPA data
let gpaEstimated = 0;
for (const s of schools) {
  if (s.gpa > 0) continue;

  const sc = s.scorecard;
  // Use SAT average to estimate typical GPA (rough heuristic)
  const satAvg = sc?.sat_average || (s.sat[0] + s.sat[1]) / 2;
  if (satAvg > 0) {
    // Heuristic: SAT 1600→4.0, SAT 1400→3.8, SAT 1200→3.5, SAT 1000→3.2, SAT 800→2.8
    const gpa = Math.min(4.0, Math.max(2.5, 2.0 + (satAvg / 800)));
    s.gpa = Math.round(gpa * 100) / 100;
    s.est = true; // Mark as estimated since GPA is derived
    gpaEstimated++;
  }
}

writeFileSync('src/data/schools.json', JSON.stringify(schools, null, 2));

console.log('=== SCORECARD DATA FIX RESULTS ===');
console.log(`Acceptance rate fixed:    ${stats.rateFixed}`);
console.log(`SAT [0,0] fixed:          ${stats.satFixed}`);
console.log(`SAT from avg estimated:   ${stats.satFromAvg}`);
console.log(`SAT improved (est):       ${stats.satDetailAdded}`);
console.log(`Tuition filled:           ${stats.tuitionFixed}`);
console.log(`Size filled:              ${stats.sizeFixed}`);
console.log(`est=true cleared:         ${stats.estCleared}`);
console.log(`GPA estimated from SAT:   ${gpaEstimated}`);

// Final summary
const final = JSON.parse(readFileSync('src/data/schools.json', 'utf-8'));
const estCount = final.filter(s => s.est).length;
const satZero = final.filter(s => s.sat[0] === 0 && s.sat[1] === 0).length;
const gpaZero = final.filter(s => !s.gpa || s.gpa === 0).length;
const tuitionZero = final.filter(s => !s.tuition || s.tuition === 0).length;
const hasSCDetail = final.filter(s => s.scorecard?.sat_math_25 > 0).length;

console.log('\n=== AFTER FIX ===');
console.log(`est=true remaining:       ${estCount} (was 801)`);
console.log(`SAT [0,0] remaining:      ${satZero} (was 65)`);
console.log(`GPA=0 remaining:          ${gpaZero} (was 28)`);
console.log(`Tuition=0 remaining:      ${tuitionZero} (was 10)`);
console.log(`SAT Math/Reading detail:  ${hasSCDetail}/1001`);
