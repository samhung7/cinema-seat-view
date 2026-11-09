// 執行：npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRow, computeGrid } from '../js/domain/row-layout.js';
import { buildHallModel, neighborSeat } from '../js/domain/hall-model.js';
import { evaluateSeat, scoreSeat } from '../js/domain/seat-metrics.js';
import { validateHall } from '../js/domain/hall-validator.js';
import { vieshowXinyiPresets } from '../js/data/vieshow-xinyi.js';

test('parseRow 展開座號範圍、輪椅位與空格', () => {
  const { label, cells } = parseRow('I: 1 2 W . 5-7');
  assert.equal(label, 'I');
  assert.deepEqual(cells, [{ num: 1 }, { num: 2 }, { wheelchair: true }, null, { num: 5 }, { num: 6 }, { num: 7 }]);
});

test('parseRow 對看不懂的格子丟出錯誤', () => {
  assert.throws(() => parseRow('A: 1 x'), /看不懂/);
  assert.throws(() => parseRow('A 1 2'), /冒號/);
});

test('computeGrid 把空欄當走道並置中', () => {
  const g = computeGrid(['A: 1 2 . 3 4', 'B: 1 2 . 3 4'], { seatWidth: 0.5, aisleWidth: 1 });
  assert.equal(g.totalWidth, 3);
  assert.equal(g.aisleX.length, 1);
  assert.ok(Math.abs(g.aisleX[0]) < 1e-9);
});

test('信義威秀 12 廳的座位數', () => {
  const presets = vieshowXinyiPresets();
  assert.equal(presets.length, 12);
  const hall12 = presets.find((p) => p.id === 'vieshow-xinyi-12').hall;
  const model = buildHallModel(hall12, { evaluate: evaluateSeat });
  assert.equal(model.seats.filter((s) => !s.wheelchair).length, 244);
  assert.equal(model.seats.filter((s) => s.wheelchair).length, 3);
});

test('neighborSeat 在排尾回傳 null', () => {
  const hall = vieshowXinyiPresets()[0].hall;
  const model = buildHallModel(hall, { evaluate: () => ({}) });
  const lastInRowA = model.rows[0].seats.at(-1);
  assert.equal(neighborSeat(model, lastInRowA, 1), null);
  assert.equal(neighborSeat(model, lastInRowA, -1).num, 19);
});

test('scoreSeat：中間舒適位置分數最高', () => {
  assert.equal(scoreSeat({ fov: 45, offAng: 0, elevAng: 0 }), 100);
  assert.ok(scoreSeat({ fov: 90, offAng: 25, elevAng: 30 }) < 30);
});

test('validateHall 補預設值且不改動輸入', () => {
  const input = { screen: { width: 10, height: 5 }, rows: ['A: 1-4'], seatWidth: 0.5, pitch: 1 };
  const out = validateHall(input);
  assert.equal(out.flatRows, 2);
  assert.equal(input.flatRows, undefined);
  assert.throws(() => validateHall({ ...input, pitch: 0 }), /pitch/);
});
