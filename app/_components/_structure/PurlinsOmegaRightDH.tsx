import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function PurlinsOmegaRightDH({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const halfRightPurlins = useMeasurementsStore((state: State) => state.halfRightPurlins);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const coveringRightLength = useMeasurementsStore((state: State) => state.coveringRightLength);
    const purlinType = useMeasurementsStore((state: State) => state.purlinType);
    const overhangLeft = useMeasurementsStore((state: State) => state.overhangLeft);
    const overhangRight = useMeasurementsStore((state: State) => state.overhangRight);

    const ref = useRef<THREE.Mesh|null>(null);
    const purlinGeometry = baseModel?.purlinsOmega;
    const requiredValues = getDefinedValues({
        halfRightPurlins,
        eavesHeight,
        coveringRightLength,
        roofInclineRad: roofIncline.rad,
        width,
        length,
        pillars,
        overhangLeft,
        overhangRight
    });

    if (!requiredValues || (requiredValues.pillars < 3 && pitches?.includes('M'))) {
        return null;
    }

    const PURLINRIGHT = () => {
        useLayoutEffect(() => {
            if (!ref.current) return;

            const {halfRightPurlins, eavesHeight, coveringRightLength, roofInclineRad, width, length, overhangLeft, overhangRight} = requiredValues;
            const mesh = new THREE.Object3D();
            const omegaWidth = ref.current.geometry.boundingBox!.getSize(new THREE.Vector3()).x;
            const omegaOffsetX = omegaWidth * Math.cos(roofInclineRad);
            const omegaOffsetY = omegaWidth * Math.sin(roofInclineRad);

            const beamPosition = (width / 2) + overhangRight;
            const heightOffset = Math.max(overhangLeft - overhangRight, 0)
                * Math.tan(roofInclineRad);
            const base = coveringRightLength * Math.cos(roofInclineRad);
            const height = coveringRightLength * Math.sin(roofInclineRad);
            const purlinGap = ((coveringRightLength / halfRightPurlins) + 0.1) > 1.52
                ? ((coveringRightLength / halfRightPurlins) + 0.1)
                : 1.52;
            const purlinOffset = purlinType === 'light' ? 0.21 : 0;

            for(let i = 0; i < halfRightPurlins; i++) {
                const hasProfileOffset = i !== 0;
                const h = ((purlinGap * i) + 0.1) * Math.sin(roofInclineRad);
                const b = Math.sqrt(Math.pow((purlinGap * i), 2) - Math.pow(h, 2))
                const purlinHeight = i === halfRightPurlins - 1
                                                    ? eavesHeight + heightOffset + height - purlinOffset
                                                    : eavesHeight + heightOffset + h - purlinOffset;

                const purlinPos = i === 0
                    ? beamPosition - 0.1
                    : i === halfRightPurlins - 1
                            ? beamPosition - base
                            : beamPosition - 0.1 - b;

                mesh.scale.z = length + 1;
                const shift =  ref.current.geometry.boundingBox!.max.x;
                ref.current.geometry.translate(-shift, 0, 0);
                mesh.position.set(
                    purlinPos + (hasProfileOffset ? omegaOffsetX : 0),
                    purlinHeight - (hasProfileOffset ? omegaOffsetY : 0),
                    -length / 2
                );
                mesh.rotation.set(0, 0, -roofInclineRad)
                ref.current.geometry.attributes.position.needsUpdate = true;
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }
        }, []);

        return(
            <instancedUniformsMesh ref={ref} args={[purlinGeometry, material, requiredValues.halfRightPurlins]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <PURLINRIGHT/>

}
