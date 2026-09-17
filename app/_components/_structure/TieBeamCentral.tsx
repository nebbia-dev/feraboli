import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function TieBeamCentral({material} : {material : THREE.Material}) {
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);
    const secondHeight = useMeasurementsStore((state: State) => state.secondHeight);

    const ref = useRef<THREE.Mesh|null>(null);

    const requiredValues = getDefinedValues({
        interaxleWidth,
        secondHeight,
        pillarsHeight,
        width,
        length,
        interaxleLength,
        pillars
    });

    if (!requiredValues) return null;

    const TIEBEAMCENTRAL = () => {
        const {length, interaxleLength, width, pillars, pillarsHeight} = requiredValues;
        const effBeams = (length / interaxleLength) + 1;
        const leftPillarIndex = Math.floor(pillars / 2) - 1;
        const rightPillarIndex = Math.floor(pillars / 2);
        const leftX = pillarsHeight[leftPillarIndex].position! - (width / 2);
        const rightX = pillarsHeight[rightPillarIndex].position! - (width / 2);
        const tieBeamGeometry = new THREE.CylinderGeometry(0.01, 0.01, rightX - leftX, 6);

        useLayoutEffect(() => {
            if (!ref.current) return;

            const {interaxleLength} = requiredValues;
            const mesh = new THREE.Object3D();

            for (let i = 0; i < effBeams; i++) {
                mesh.position.set(
                    (leftX + rightX) / 2,
                    pillarsHeight[leftPillarIndex].totalHeight!,
                    -interaxleLength * i
                );
                mesh.rotation.set(0, 0, Math.PI/2);
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }
        }, [effBeams, interaxleLength, leftPillarIndex, leftX, pillarsHeight, rightX]);

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[tieBeamGeometry, material, effBeams]}>
            </instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <TIEBEAMCENTRAL/>
}
