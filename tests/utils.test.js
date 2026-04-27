/* ============================================================
   Tests — utils.js
   ============================================================ */

TEST.suite('fmtCurrency', () => {
  TEST.test('formats positive integer', () => {
    TEST.eq(fmtCurrency(5000), '5 000 FCFA');
  });
  TEST.test('formats zero', () => {
    TEST.eq(fmtCurrency(0), '0 FCFA');
  });
  TEST.test('formats large number with thousands separator', () => {
    const result = fmtCurrency(1500000);
    TEST.assert(result.includes('1'), `Expected "1..." got "${result}"`);
    TEST.assert(result.includes('FCFA'), 'Missing FCFA suffix');
  });
  TEST.test('handles null', () => {
    TEST.eq(fmtCurrency(null), '0 FCFA');
  });
  TEST.test('handles NaN', () => {
    TEST.eq(fmtCurrency(NaN), '0 FCFA');
  });
  TEST.test('custom currency suffix', () => {
    TEST.assert(fmtCurrency(100, 'USD').includes('USD'), 'Should use custom suffix');
  });
});

TEST.suite('fmtUSD', () => {
  TEST.test('formats dollars', () => {
    const result = fmtUSD(1234.5);
    TEST.assert(result.includes('$'), 'Missing $ symbol');
    TEST.assert(result.includes('1,234'), 'Missing thousands separator');
  });
  TEST.test('formats zero', () => {
    TEST.eq(fmtUSD(0), '$0.00');
  });
  TEST.test('handles null', () => {
    TEST.eq(fmtUSD(null), '$0.00');
  });
});

TEST.suite('fmtDate', () => {
  TEST.test('formats ISO date string', () => {
    const result = fmtDate('2026-04-26');
    TEST.assert(result.includes('26'), 'Day missing');
    TEST.assert(result.includes('04') || result.includes('4'), 'Month missing');
    TEST.assert(result.includes('2026'), 'Year missing');
  });
  TEST.test('handles empty string', () => {
    TEST.eq(fmtDate(''), '');
  });
  TEST.test('handles null', () => {
    TEST.eq(fmtDate(null), '');
  });
});

TEST.suite('todayStr', () => {
  TEST.test('returns ISO YYYY-MM-DD format', () => {
    const today = todayStr();
    TEST.assert(/^\d{4}-\d{2}-\d{2}$/.test(today), `Expected YYYY-MM-DD, got "${today}"`);
  });
  TEST.test('matches today\'s year', () => {
    const year = new Date().getFullYear().toString();
    TEST.assert(todayStr().startsWith(year), 'Year mismatch');
  });
});

TEST.suite('calcTVA / calcTTC / calcHT', () => {
  TEST.test('calcTVA at 18%', () => {
    TEST.near(calcTVA(1000), 180);
  });
  TEST.test('calcTTC adds 18%', () => {
    TEST.near(calcTTC(1000), 1180);
  });
  TEST.test('calcHT reverses calcTTC', () => {
    TEST.near(calcHT(1180), 1000);
  });
  TEST.test('calcTVA of zero is zero', () => {
    TEST.eq(calcTVA(0), 0);
  });
  TEST.test('round-trip HT → TTC → HT', () => {
    const ht = 4250;
    TEST.near(calcHT(calcTTC(ht)), ht);
  });
});

TEST.suite('applyRemise', () => {
  TEST.test('10% remise on 1000 = 900', () => {
    TEST.near(applyRemise(1000, 10), 900);
  });
  TEST.test('0% remise returns original price', () => {
    TEST.near(applyRemise(500, 0), 500);
  });
  TEST.test('100% remise returns 0', () => {
    TEST.near(applyRemise(500, 100), 0);
  });
  TEST.test('undefined remise treated as 0', () => {
    TEST.near(applyRemise(500, undefined), 500);
  });
  TEST.test('50% remise halves the price', () => {
    TEST.near(applyRemise(800, 50), 400);
  });
});

TEST.suite('fmtNum', () => {
  TEST.test('2 decimal places by default', () => {
    TEST.eq(fmtNum(3.14159), '3.14');
  });
  TEST.test('0 decimal places', () => {
    TEST.eq(fmtNum(3.7, 0), '4');
  });
  TEST.test('handles null', () => {
    TEST.eq(fmtNum(null), '0');
  });
});

TEST.suite('seqId', () => {
  TEST.test('first ID with empty array', () => {
    TEST.eq(seqId('V', []), 'V0001');
  });
  TEST.test('next ID after existing', () => {
    TEST.eq(seqId('V', [{ id: 'V0001' }, { id: 'V0002' }]), 'V0003');
  });
  TEST.test('handles gaps in sequence', () => {
    TEST.eq(seqId('CL', [{ id: 'CL0001' }, { id: 'CL0005' }]), 'CL0006');
  });
  TEST.test('custom prefix PRD', () => {
    TEST.eq(seqId('PRD', [{ id: 'PRD0010' }]), 'PRD0011');
  });
  TEST.test('null existing returns first ID', () => {
    TEST.eq(seqId('F', null), 'F0001');
  });
  TEST.test('pads to 4 digits by default', () => {
    const id = seqId('ACH', []);
    TEST.assert(id.length === 7, `Expected length 7, got ${id.length} for "${id}"`);
  });
});

TEST.suite('genId', () => {
  TEST.test('starts with prefix', () => {
    TEST.assert(genId('VL').startsWith('VL'), 'Must start with prefix');
  });
  TEST.test('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => genId('X')));
    TEST.eq(ids.size, 100, 'Expected 100 unique IDs');
  });
  TEST.test('is a string', () => {
    TEST.assert(typeof genId('T') === 'string', 'Must be string');
  });
});

TEST.suite('filterRows', () => {
  const rows = [
    { id: 'A001', nom: 'Huile Castrol', categorie: 'Huile' },
    { id: 'A002', nom: 'Filtre à air', categorie: 'Filtre' },
    { id: 'A003', nom: 'Liquide de frein', categorie: 'Liquide' },
  ];

  TEST.test('empty query returns all rows', () => {
    TEST.eq(filterRows(rows, '', ['nom']).length, 3);
  });
  TEST.test('case-insensitive match', () => {
    TEST.eq(filterRows(rows, 'CASTROL', ['nom']).length, 1);
  });
  TEST.test('matches across multiple fields', () => {
    TEST.eq(filterRows(rows, 'huile', ['nom', 'categorie']).length, 1);
  });
  TEST.test('no match returns empty array', () => {
    TEST.eq(filterRows(rows, 'XXXNOTFOUND', ['nom']).length, 0);
  });
  TEST.test('partial match works', () => {
    TEST.assert(filterRows(rows, 'liquide', ['nom', 'categorie']).length >= 1);
  });
});

TEST.suite('pct', () => {
  TEST.test('50% ratio', () => {
    TEST.eq(pct(0.5), '50.0%');
  });
  TEST.test('handles null', () => {
    TEST.eq(pct(null), '0%');
  });
  TEST.test('100% ratio', () => {
    TEST.eq(pct(1), '100.0%');
  });
});

TEST.suite('exportCSV (smoke test)', () => {
  TEST.test('does not throw on valid data', () => {
    let threw = false;
    try {
      exportCSV('test.csv',
        [{ key: 'id', label: 'ID' }, { key: 'nom', label: 'Nom' }],
        [{ id: 'P001', nom: 'Test' }]
      );
    } catch (e) {
      threw = true;
    }
    TEST.assert(!threw, 'exportCSV should not throw');
  });
});
