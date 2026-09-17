import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function TieBeam({material} : {material : THREE.Material}) {
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);
    const secondHeight = useMeasurementsStore((state: State) => state.secondHeight);

    const ref = useRef<THREE.Mesh|null>(null);

    const requiredValues = getDefinedValues({
        interaxleWidth,
        pillarsHeight,
        width,
        length,
        interaxleLength,
        pillars,
        pitches
    });

    if (!requiredValues) return null;

    const TIEBEAM = () => {
        const {length, interaxleLength, width, pitches, pillarsHeight, pillars} = requiredValues;
        const hasSecondHeight = secondHeight !== undefined;
        const frames = (length / interaxleLength) + 1;
        const effBeams = hasSecondHeight ? frames * 2 : frames;
        const leftCentralPillarIndex = Math.floor(pillars / 2) - 1;
        const rightCentralPillarIndex = Math.floor(pillars / 2);
        const leftStartX = pillarsHeight[0].position! - (width / 2);
        const leftEndX = hasSecondHeight
            ? pillarsHeight[leftCentralPillarIndex].position! - (width / 2)
            : pillarsHeight[pillars - 1].position! - (width / 2);
        const rightStartX = pillarsHeight[rightCentralPillarIndex].position! - (width / 2);
        const rightEndX = pillarsHeight[pillars - 1].position! - (width / 2);
        const tieBeamLength = leftEndX - leftStartX;
        const tieBeamGeometry = new THREE.CylinderGeometry(0.01, 0.01, tieBeamLength, 6);

        useLayoutEffect(() => {
            if (!ref.current) return;

            const {interaxleLength, pillars} = requiredValues;
            const mesh = new THREE.Object3D();

            for (let i = 0; i < effBeams; i++) {
                if (hasSecondHeight) {
                    const isLeft = i % 2 === 0;
                    const startX = isLeft ? leftStartX : rightStartX;
                    const endX = isLeft ? leftEndX : rightEndX;
                    const pillarIndex = isLeft ? 0 : pillars - 1;

                    mesh.position.set(
                        (startX + endX) / 2,
                        pillarsHeight[pillarIndex].totalHeight!,
                        -interaxleLength * Math.floor(i / 2)
                    );
                } else {
                    const tieBeamX = (leftStartX + leftEndX) / 2;
                    if(pitches === 'S' && pillars === 3) {
                        mesh.position.set(tieBeamX, pillarsHeight[pillars - 1].totalHeight!, -interaxleLength * i);

                    } else {
                        mesh.position.set(tieBeamX, pillarsHeight[0].totalHeight!, -interaxleLength * i);
                    }
                }

                mesh.rotation.set(0, 0, Math.PI/2);
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }
        }, [effBeams, hasSecondHeight, interaxleLength, leftEndX, leftStartX, pillarsHeight, pitches, rightEndX, rightStartX]);

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[tieBeamGeometry, material, effBeams]}>
            </instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <TIEBEAM/>
}
