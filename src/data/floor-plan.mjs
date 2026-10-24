/**
 * Presentation-only coordinates for the three schematic hospital floors.
 * The clinical navigation graph lives in hospital.mjs and is not modified here.
 * Layout markers are 12 x 9 viewBox units; positions are deliberately spaced
 * to avoid colliding labels, including the first-floor WC and A101.
 */
const pointRows = [
  {
    'corridor-0':[50,57], 'toilets-0':[12,24], water:[34,24], lab:[57,24], pharmacy:[82,24],
    help:[25,52], xray:[76,51], registration:[16,70], 'lift-0':[35,69],
    'stairs-0':[65,70], emergency:[85,70], wheelchair:[17,88], ramp:[50,79], entrance:[50,92]
  },
  {
    'corridor-1':[47,64], 'toilets-1':[14,81],
    'opd-1':[15,22], 'opd-2':[36,22], 'opd-3':[57,22], 'opd-4':[79,22],
    'opd-5':[15,48], 'opd-6':[36,48], 'opd-7':[57,48], 'opd-8':[79,48],
    'lift-1':[39,81], 'stairs-1':[62,81], waiting:[85,81]
  },
  {
    'corridor-2':[50,59], 'ward-4':[19,26], 'ward-5':[50,26], 'ward-6':[81,26],
    nurses:[17,82], 'lift-2':[46,82], 'stairs-2':[74,82]
  }
];

export const floorPlanPoint = place => {
  const xy = pointRows[place.floor]?.[place.id];
  if (!xy) throw new Error(`Missing schematic position for ${place.id}`);
  return {x:xy[0], y:xy[1]};
};

/** Trace a shared corridor and branches, rather than a star of diagonal lines. */
export function floorPlanSegmentPath(a, b) {
  if (a.floor !== b.floor) return null;
  const floor = a.floor;
  const corridor = `corridor-${floor}`;
  if (floor === 0 && [a.id,b.id].includes('entrance') && [a.id,b.id].includes('ramp')) {
    return 'M50 79 V92';
  }
  const place = a.id === corridor ? b : b.id === corridor ? a : null;
  if (!place) throw new Error(`Unexpected floor-plan edge: ${a.id} – ${b.id}`);
  const {x,y} = floorPlanPoint(place);
  if (floor === 1) {
    return place.type === 'room' ? `M47 64 V35 H${x} V${y}` : `M47 64 V69 H${x} V${y}`;
  }
  if (floor === 2) {
    return place.type === 'ward' ? `M50 59 V42 H${x} V${y}` : `M50 59 V69 H${x} V${y}`;
  }
  if (['toilet','water','lab','pharmacy'].includes(place.type)) return `M50 57 V37 H${x} V${y}`;
  if (['help','xray'].includes(place.type)) return `M50 57 H${x} V${y}`;
  if (place.id === 'wheelchair') return `M50 57 H8 V82 H${x} V${y}`;
  if (place.id === 'ramp') return `M50 57 V${y}`;
  return `M50 57 V63 H${x} V${y}`;
}

export const FLOOR_PLAN_MARKER = {width:12,height:9};
