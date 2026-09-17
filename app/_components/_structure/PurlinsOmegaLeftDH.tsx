import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function PurlinsOmegaLeftDH({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const halfLeftPurlins = useMeasurementsStore((state: State) => state.halfLeftPurlins);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const coveringLeftLength = useMeasurementsStore((state: State) => state.coveringLeftLength);
    const secondRoofIncline = useMeasurementsStore((state: State) => state.secondRoofIncline);
    const secondCoveringLength = useMeasurementsStore((state: State) => state.secondCoveringLength);
    const secondHalfPurlins = useMeasurementsStore((state: State) => state.secondHalfPurlins);
    const purlinType = useMeasurementsStore((state: State) => state.purlinType);
    const overhangLeft = useMeasurementsStore((state: State) => state.overhangLeft);
    const overhangRight = useMeasurementsStore((state: State) => state.overhangRight);

    const ref = useRef<THREE.Mesh|null>(null);
    const purlinGeometry = baseModel?.purlinsOmega;
    const hP = secondHalfPurlins ?? halfLeftPurlins;
    const requiredValues = getDefinedValues({
        hP,
        eavesHeight,
        coveringLeftLength,
        roofInclineRad: roofIncline.rad,
        width,
        length,
        pillars,
        overhangLeft,
        overhangRight
    });

    if (!requiredValues) return null;

    const PURLINLEFT = () => {
        useLayoutEffect(() => {
            if (!ref.current) return;

            const {hP, eavesHeight, coveringLeftLength, roofInclineRad, width, length, overhangLeft, overhangRight} = requiredValues;
            const cL = secondCoveringLength ?? coveringLeftLength;
            const roofRad = secondRoofIncline.rad ?? roofInclineRad;
            const mesh = new THREE.Object3D();
            const beamPosition = -(width / 2) - overhangLeft;
            const heightOffset = Math.max(overhangRight - overhangLeft, 0)
                * Math.tan(roofRad);

            const base = cL * Math.cos(roofRad);
            const height = (cL + 0.1) * Math.sin(roofRad);
            const purlinGap = (((cL + 0.1) / hP) + 0.1) > 1.52
                                        ? (((cL + 0.1) / hP) + 0.1)
                                        : 1.52;
            const purlinOffset = purlinType === 'light' ? 0.21 : 0;

            for(let i = 0; i < hP; i++) {
                const h = ((purlinGap * i) + 0.1) * Math.sin(roofRad);
                const b = Math.sqrt(Math.pow((purlinGap * i), 2) - Math.pow(h, 2))
                const purlinHeight = i === 0
                                                ? eavesHeight + heightOffset - purlinOffset + (0.308 * Math.sin(roofRad))
                                                : i === hP - 1 && secondCoveringLength
                                                    ? eavesHeight + heightOffset + height + 0.1 - purlinOffset
                                                    : i === hP - 1
                                                        ? eavesHeight + heightOffset + height - purlinOffset - (0.204 * Math.sin(roofInclineRad))
                                                        : eavesHeight + heightOffset + h - purlinOffset;

                const purlinPos = i === 0
                                            ? beamPosition + 0.308
                                            : i === hP - 1 && secondCoveringLength
                                                ? 0
                                            : i === hP - 1
                                                    ? base + beamPosition - 0.102
                                                    : b + beamPosition + 0.1;

                mesh.scale.z = length + 1;
                const shift =  ref.current.geometry.boundingBox!.max.x;
                ref.current.geometry.translate(-shift, 0, 0);
                mesh.position.set(purlinPos, purlinHeight, -length / 2);
                mesh.rotation.set(0, 0, roofRad)
                ref.current.geometry.attributes.position.needsUpdate = true;
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }
        }, []);

        return(
            <instancedUniformsMesh ref={ref} args={[purlinGeometry, material, requiredValues.hP]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <PURLINLEFT/>
}
