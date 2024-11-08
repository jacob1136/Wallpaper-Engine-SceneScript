'use strict';

const DRAG_MAX_DISTANCE = 100; //骨骼能拖多远
const DRAG_MAX_RADIUS = 200; //可拖动区域的大小
const IMPULSE_SCALE = 0.03; //其他骨骼形成的脉冲有多大（如果不需要，则为 0）
const CLICK_BOUNCE = new Vec3(0, 70, 0)


var activeDragBone = -1;
var dragDelta;
var originalbonepos;
var dragStart;
var dragDist
var drag


/**
 * @param {Boolean} value - “可见”属性
 * @return {Boolean} - 更新当前属性值
 */
export function update() {
	if (activeDragBone >= 0) {
		drag = input.cursorWorldPosition.subtract(dragStart); //鼠标拖动的起始位置
		dragDist = drag.length(); //拖曳距离
		if (dragDist > 0) {
			drag = drag.divide(dragDist); //拖曳方向为单位矢量（我这么寻思的）
			//将距离限制为顶部 DRAG_MAX_DISTANCE 常量中配置的最大距离
			drag = dragStart.add(drag.multiply(Math.min(DRAG_MAX_DISTANCE, dragDist)));
			//将骨骼移动到新计算出的拖动距离
			thisLayer.setBoneTransform(activeDragBone, thisLayer.getBoneTransform(activeDragBone).translation(drag.add(dragDelta)));
		}
	}
}


/**
 * @param {ICursorEvent} event
 */
export function cursorDown(event) {
	activeDragBone = -1;
	var bestDist = DRAG_MAX_RADIUS;
	var numBones = thisLayer.getBoneCount();
	dragStart = event.worldPosition; //鼠标起始位置
	
	//选择最近的骨骼
	for (var b = 0; b < numBones; ++b) {
		var bonePos = thisLayer.getBoneTransform(b).translation();
		var delta = bonePos.copy().subtract(event.worldPosition);
		var len = delta.length();
		if (len < bestDist) {
			bestDist = len;
			activeDragBone = b;
			originalbonepos = bonePos;
			dragDelta = delta;
		}
	}
}


/**
 * @param {ICursorEvent} event
 */
export function cursorUp(event) {
	if (activeDragBone >= 0) {
		var skipBone = activeDragBone;
		activeDragBone = -1;

		//在同一位置点击和释放时移动
		if (dragDist == 0) {
			var skipBonepos = thisLayer.getBoneTransform(skipBone)
			thisLayer.setBoneTransform(skipBone, skipBonepos.translation(skipBonepos.translation().add(CLICK_BOUNCE)));
		}

		//冲击交互
		var releaseDistance = originalbonepos.subtract(thisLayer.getBoneTransform(skipBone).translation());
		releaseDistance.z = 0;
		if (releaseDistance.length() > 10) {
			engine.setTimeout(function () {
				var numBones = thisLayer.getBoneCount();
				for (var b = 0; b < numBones; ++b) {
					if (b != skipBone) {
						var impactPos = thisLayer.getBoneTransform(skipBone).translation();
						var impulseScale = thisLayer.getBoneTransform(b).translation().subtract(impactPos).length();
						thisLayer.applyBonePhysicsImpulse(b, releaseDistance.multiply(impulseScale * IMPULSE_SCALE));
					}
				}
			}, 100);
		}
	}
}