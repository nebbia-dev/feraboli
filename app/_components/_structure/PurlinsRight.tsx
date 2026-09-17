import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

export default function PurlinsRight({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const halfPurlins = useMeasurementsStore((state: State) => state.halfPurlins);
    const halfPurlinsDH = useMeasurementsStore((state: State) => state.halfPurlinsDH);
    const halfRightPurlins = useMeasurementsStore((state: State) => state.halfRightPurlins);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const coveringLength = useMeasurementsStore((state: State) => state.coveringLength);
    const coveringRightLength = useMeasurementsStore((state: State) => state.coveringRightLength);
    const purlinType = useMeasurementsStore((state: State) => state.purlinType);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);
    const overhangRight = useMeasurementsStore((state: State) => state.overhangRight);
    const overhangLeft = useMeasurementsStore((state: State) => state.overhangLeft);

    const ref = useRef<THREE.Mesh|null>(null);
    const purlinGeometry = baseModel?.purlinsRight;
    const isDoubleHeight = pillars !== undefined && pillars > 3 && pitches === 'DH';
    const activeHalfPurlins = isDoubleHeight
        ? halfPurlinsDH
        : halfRightPurlins ?? halfPurlins;
    const activeCoveringLength = isDoubleHeight
        ? coveringLength
        : coveringRightLength ?? coveringLength;
    const requiredValues = getDefinedValues({
        activeHalfPurlins,
        eavesHeight,
        activeCoveringLength,
        roofInclineRad: roofIncline.rad,
        width,
        length,
        pillars,
        overhangRight,
        overhangLeft
    });

    if (!requiredValues || (requiredValues.pillars < 3 && pitches?.includes('M'))) {
        return null;
    }

    const PURLINRIGHT = () => {
        useLayoutEffect(() => {
            if (!ref.current) return;

            const {activeHalfPurlins, eavesHeight, activeCoveringLength, roofInclineRad, width, length, pillars, overhangRight, overhangLeft} = requiredValues;
            const mesh = new THREE.Object3D();

            const beamPosition = (interaxleWidth && pillars > 3 && pitches === 'DH')
                ? (interaxleWidth / 2) + 0.5
                : (width / 2) + overhangRight

            const hoverhang = !isDoubleHeight && overhangLeft > overhangRight
                ? overhangLeft - overhangRight
                : 0;
            const hta = hoverhang * Math.tan(roofInclineRad);

            const base = activeCoveringLength * Math.cos(roofInclineRad);
            const height = activeCoveringLength * Math.sin(roofInclineRad);
            const purlinGap = ((activeCoveringLength / activeHalfPurlins) + 0.1) > 1.52
                ? ((activeCoveringLength / activeHalfPurlins) + 0.1)
                : 1.52;
            const purlinOffset = purlinType === 'light' ? 0.21 : 0;

            for(let i = 0; i < activeHalfPurlins; i++) {
                const h = ((purlinGap * i) + 0.1) * Math.sin(roofInclineRad);
                const b = Math.sqrt(Math.pow((purlinGap * i), 2) - Math.pow(h, 2))
                const purlinHeight = i === activeHalfPurlins - 1
                                                    ? eavesHeight + hta + height - purlinOffset + secondHeightOffset
                                                    : eavesHeight + hta + h - purlinOffset + secondHeightOffset;

                const purlinPos = i === 0
                    ? beamPosition - 0.1
                    : i === activeHalfPurlins - 1
                            ? beamPosition - base
                            : beamPosition - 0.1 - b;

                mesh.scale.z = length + 1;
                const shift =  ref.current.geometry.boundingBox!.max.x;
                ref.current.geometry.translate(-shift, 0, 0);
                mesh.position.set(purlinPos, purlinHeight, -length / 2);
                mesh.rotation.set(0, Math.PI, roofInclineRad)
                ref.current.geometry.attributes.position.needsUpdate = true;
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }
        }, []);

        return(
            <instancedUniformsMesh ref={ref} args={[purlinGeometry, material, requiredValues.activeHalfPurlins]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <PURLINRIGHT/>

}
