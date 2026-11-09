import { getSeatType } from '../config/seat-types.js';

export const seatName = (s) => (s.wheelchair ? `${s.row} 排 輪椅位 ${s.wheelchairNo}` : `${s.row} 排 ${s.num} 號`);
export const seatShortName = (s) => (s.wheelchair ? `${s.row} 排輪椅位` : `${s.row}${s.num}`);
export const seatTypeLabel = (type) => getSeatType(type).label;
