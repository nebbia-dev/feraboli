import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";
import {
    BeamClippingGroup,
    useBeamClippingMaterials
} from "@/app/_utils/useBeamClippingMaterials";

export default function Struts({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const secondHeight = useMeasurementsStore((state: State) => state.secondHeight);
    const overhangLeft = useMeasurementsStore((state: State) => state.overhangLeft);
    const overhangRight = useMeasurementsStore((state: State) => state.overhangRight);

    const primaryLeftRef = useRef<THREE.Mesh|null>(null);
    const primaryRightRef = useRef<THREE.Mesh|null>(null);
    const primaryCenterRef = useRef<THREE.Mesh|null>(null);
    const outerLeftRef = useRef<THREE.Mesh|null>(null);
    const outerRightRef = useRef<THREE.Mesh|null>(null);
    const strutsDGeometry = baseModel?.capitalStrutsD;
    const beamClipping = useBeamClippingMaterials(material);

    const requiredValues = getDefinedValues({
        pillars,
        pitches,
        pillarsHeight,
        width,
        length,
        interaxleLength,
        overhangLeft,
        overhangRight
    });

    if (!requiredValues || !beamClipping.ready) return null;

    const effPillars = secondHeight
        ? requiredValues.pillars - 2
        : pitches === 'S' && pillars === 3
            ? requiredValues.pillars - 1
            : requiredValues.pillars;
    const frames = (requiredValues.length / requiredValues.interaxleLength) + 1;
    const activePillarIndices = Array.from({length: effPillars}, (_, remainder) => {
        if (secondHeight) {
            return remainder < effPillars / 2
                ? remainder
                : remainder + 2;
        }

        if (pitches === "S" && pillars === 3) {
            return remainder < effPillars / 2
                ? remainder
                : remainder + 1;
        }

        return remainder;
    }).filter((pillarIndex) => {
        // The only pillar is the central support, not an outer support to be
        // replaced by one of the single-sided capital models.
        if (requiredValues.pillars === 1) return true;

        const isFirstPillar = pillarIndex === 0;
        const isLastPillar = pillarIndex === requiredValues.pillars - 1;

        return !(isFirstPillar && requiredValues.overhangLeft < 1.5)
            && !(isLastPillar && requiredValues.overhangRight < 1.5);
    });
    const groupedPillarIndices: Record<BeamClippingGroup, number[]> = {
        primaryLeft: [],
        primaryRight: [],
        primaryBoth: [],
        outerLeft: [],
        outerRight: []
    };

    activePillarIndices.forEach((pillarIndex) => {
        let group: BeamClippingGroup;

        if (secondHeight) {
            group = pillarIndex < requiredValues.pillars / 2
                ? "outerLeft"
                : "outerRight";
        } else {
            const pillarX = requiredValues.pillarsHeight[pillarIndex].position!
                - (requiredValues.width / 2);

            group = Math.abs(pillarX) < 1e-6
                ? pitches?.includes("M")
                    ? "primaryLeft"
                    : "primaryBoth"
                : pillarX < 0
                    ? "primaryLeft"
                    : "primaryRight";
        }

        groupedPillarIndices[group].push(pillarIndex);
    });

    const PILLARS = () => {
        useLayoutEffect(() => {
            if (groupedPillarIndices.primaryLeft.length && !primaryLeftRef.current) return;
            if (groupedPillarIndices.primaryRight.length && !primaryRightRef.current) return;
            if (groupedPillarIndices.primaryBoth.length && !primaryCenterRef.current) return;
            if (groupedPillarIndices.outerLeft.length && !outerLeftRef.current) return;
            if (groupedPillarIndices.outerRight.length && !outerRightRef.current) return;

            const {pillarsHeight, width, length, interaxleLength} = requiredValues;
            const mesh = new THREE.Object3D();
            const groupIndices: Record<BeamClippingGroup, number> = {
                primaryLeft: 0,
                primaryRight: 0,
                primaryBoth: 0,
                outerLeft: 0,
                outerRight: 0
            };
            const groupRefs: Record<BeamClippingGroup, React.RefObject<THREE.Mesh|null>> = {
                primaryLeft: primaryLeftRef,
                primaryRight: primaryRightRef,
                primaryBoth: primaryCenterRef,
                outerLeft: outerLeftRef,
                outerRight: outerRightRef
            };

            for (let frame = 0; frame < (length / interaxleLength) + 1; frame++) {
                for (const group of Object.keys(groupedPillarIndices) as BeamClippingGroup[]) {
                    for (const pillarIndex of groupedPillarIndices[group]) {
                        mesh.position.set(
                            pillarsHeight[pillarIndex].position! - (width / 2),
                            pillarsHeight[pillarIndex].totalHeight! - 1.03,
                            -interaxleLength * frame
                        );
                        mesh.rotation.set(Math.PI / 2, 0, 0);
                        mesh.updateMatrix();
                        const instanceIndex = groupIndices[group];
                        (groupRefs[group].current as InstancedMesh)
                            .setMatrixAt(instanceIndex, mesh.matrix);
                        groupIndices[group]++;
                    }
                }
            }
        }, []);

        return(
            <>
                {groupedPillarIndices.primaryLeft.length > 0 &&
                    <instancedUniformsMesh
                        ref={primaryLeftRef}
                        args={[
                            strutsDGeometry,
                            beamClipping.materials.primaryLeft,
                            groupedPillarIndices.primaryLeft.length * frames
                        ]}>
                    </instancedUniformsMesh>
                }
                {groupedPillarIndices.primaryRight.length > 0 &&
                    <instancedUniformsMesh
                        ref={primaryRightRef}
                        args={[
                            strutsDGeometry,
                            beamClipping.materials.primaryRight,
                            groupedPillarIndices.primaryRight.length * frames
                        ]}>
                    </instancedUniformsMesh>
                }
                {groupedPillarIndices.primaryBoth.length > 0 &&
                    <instancedUniformsMesh
                        ref={primaryCenterRef}
                        args={[
                            strutsDGeometry,
                            beamClipping.materials.primaryBoth,
                            groupedPillarIndices.primaryBoth.length * frames
                        ]}>
                    </instancedUniformsMesh>
                }
                {groupedPillarIndices.outerLeft.length > 0 &&
                    <instancedUniformsMesh
                        ref={outerLeftRef}
                        args={[
                            strutsDGeometry,
                            beamClipping.materials.outerLeft,
                            groupedPillarIndices.outerLeft.length * frames
                        ]}>
                    </instancedUniformsMesh>
                }
                {groupedPillarIndices.outerRight.length > 0 &&
                    <instancedUniformsMesh
                        ref={outerRightRef}
                        args={[
                            strutsDGeometry,
                            beamClipping.materials.outerRight,
                            groupedPillarIndices.outerRight.length * frames
                        ]}>
                    </instancedUniformsMesh>
                }
            </>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <PILLARS/>
}
