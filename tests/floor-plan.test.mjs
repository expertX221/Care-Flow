import {test} from 'node:test';
import assert from 'node:assert/strict';
import {places,edges,shortestPath} from '../src/data/hospital.mjs';
import {floorPlanPoint,floorPlanSegmentPath,FLOOR_PLAN_MARKER} from '../src/data/floor-plan.mjs';

test('all mapped rooms have visible, nonoverlapping hit targets on every floor',()=>{
  for(let floor=0;floor<3;floor++){
    const nodes=places.filter(place=>place.floor===floor && place.type!=='corridor');
    for(const node of nodes){
      const {x,y}=floorPlanPoint(node);
      assert.ok(x-FLOOR_PLAN_MARKER.width/2>=2 && x+FLOOR_PLAN_MARKER.width/2<=98,`x border: ${node.id}`);
      assert.ok(y-FLOOR_PLAN_MARKER.height/2>=5 && y+FLOOR_PLAN_MARKER.height/2<=97,`y border: ${node.id}`);
      for(const other of nodes.filter(p=>p.id!==node.id)){
        const p=floorPlanPoint(other);
        assert.ok(
          Math.abs(x-p.x)>=FLOOR_PLAN_MARKER.width+2 || Math.abs(y-p.y)>=FLOOR_PLAN_MARKER.height+2,
          `${node.id} overlaps or crowds ${other.id}`
        );
      }
    }
  }
});

test('every floor-graph segment draws as a continuous orthogonal corridor',()=>{
  for(const edge of edges){
    const a=places.find(p=>p.id===edge.from),b=places.find(p=>p.id===edge.to);
    if(a.floor!==b.floor)continue;
    const route=floorPlanSegmentPath(a,b);
    assert.match(route,/^M\d+ \d+(?: [HV]\d+)+$/);
    assert.ok(!/[LCQ]/.test(route),`curved or diagonal segment: ${edge.from}`);
  }
});

test('map-only spacing improvements do not affect real navigation paths',()=>{
  const original=shortestPath('entrance','opd-1');
  floorPlanPoint(places.find(p=>p.id==='toilets-1'));
  assert.deepEqual(shortestPath('entrance','opd-1'),original);
});
