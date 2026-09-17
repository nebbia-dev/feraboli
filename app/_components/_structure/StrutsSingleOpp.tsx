import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";
import {useBeamClippingMaterials} from "@/app/_utils/useBeamClippingMaterials";

export default function StrutsSingleOpp({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const secondHeight = useMeasurementsStore((state: State) => state.secondHeight);
    const overhangLeft = useMeasurementsStore((state: State) => state.overhangLeft);

    const firstRef = useRef<THREE.Mesh|null>(null);
    const secondRef = useRef<THREE.Mesh|null>(null);
    const outerLeftRef = useRef<THREE.Mesh|null>(null);
    const strutsSGeometry = baseModel?.capitalStrutsSOpp;
    const beamClipping = useBeamClippingMaterials(material);

    const requiredValues = getDefinedValues({
        pillars,
        pitches,
        pillarsHeight,
        width,
        length,
        interaxleLength,
        roofIncline,
        eavesHeight,
        overhangLeft
    });

    if (!requiredValues || !beamClipping.ready) return null;

    const isShed = pitches === "S" && pillars === 3;
    const hasDoubleHeight = secondHeight !== undefined && requiredValues.pillars > 3;
    const effPillars = isShed ? 1 : secondHeight !== undefined ? 2 : 0;
    const frames = (requiredValues.length / requiredValues.interaxleLength) + 1;
    const firstCount = effPillars > 0 ? frames : 0;
    const secondCount = secondHeight !== undefined && !isShed ? frames : 0;
    const outerLeftCount = requiredValues.overhangLeft < 1.5 ? frames : 0;
    const firstMaterial = isShed
        ? beamClipping.materials.primaryRight
        : beamClipping.materials.primaryLeft;
    const outerLeftMaterial = hasDoubleHeight
        ? beamClipping.materials.outerLeft
        : beamClipping.materials.primaryLeft;

    const PILLARS = () => {
        useLayoutEffect(() => {
            if (firstCount > 0 && !firstRef.current) return;
            if (secondCount > 0 && !secondRef.current) return;
            if (outerLeftCount > 0 && !outerLeftRef.current) return;

            const {pillars, pillarsHeight, width, length, interaxleLength, roofIncline, eavesHeight} = requiredValues;
            const mesh = new THREE.Object3D();
            let firstIndex = 0;
            let secondIndex = 0;

            for(let i = 0; i < (effPillars * (length / interaxleLength)) + effPillars; i++) {
                const remainder = i % 2;
                let index, height;

                if(isShed) {
                    index = 1;
                    height = eavesHeight - 1.01 + (roofIncline.percentage! * pillarsHeight[index].position!) / 100;
                } else {
                    if (remainder === 0) {
                        index = (pillars / 2) - 1;
                        height = pillarsHeight[index].totalHeight! - 1.03;
                    } else {
                        index = pillars / 2;
                        height = pillarsHeight[index].totalHeight!
                            - secondHeight!
                            - 1.01
                            - 0.25;
                    }
                }

                mesh.position.set(pillarsHeight[index].position! - (width / 2), height, - interaxleLength * Math.floor(i / effPillars));
                mesh.rotation.set(Math.PI/2, 0 ,0);
                mesh.updateMatrix();

                if (isShed || remainder === 0) {
                    (firstRef.current as InstancedMesh).setMatrixAt(firstIndex, mesh.matrix);
                    firstIndex++;
                } else {
                    (secondRef.current as InstancedMesh).setMatrixAt(secondIndex, mesh.matrix);
                    secondIndex++;
                }
            }

            if (outerLeftRef.current) {
                const pillarIndex = 0;

                for (let frame = 0; frame < frames; frame++) {
                    mesh.position.set(
                        pillarsHeight[pillarIndex].position! - (width / 2),
                        pillarsHeight[pillarIndex].totalHeight! - 1.03,
                        -interaxleLength * frame
                    );
                    mesh.rotation.set(Math.PI / 2, 0, 0);
                    mesh.updateMatrix();
                    (outerLeftRef.current as InstancedMesh).setMatrixAt(frame, mesh.matrix);
                }
            }
        }, []);

        return(
            <>
                {firstCount > 0 &&
                    <instancedUniformsMesh
                        ref={firstRef}
                        args={[strutsSGeometry, firstMaterial, firstCount]}>
                    </instancedUniformsMesh>
                }
                {secondCount > 0 &&
                    <instancedUniformsMesh
                        ref={secondRef}
                        args={[
                            strutsSGeometry,
                            beamClipping.materials.outerRight,
                            secondCount
                        ]}>
                    </instancedUniformsMesh>
                }
                {outerLeftCount > 0 &&
                    <instancedUniformsMesh
                        ref={outerLeftRef}
                        args={[strutsSGeometry, outerLeftMaterial, outerLeftCount]}>
                    </instancedUniformsMesh>
                }
            </>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <PILLARS/>
}
