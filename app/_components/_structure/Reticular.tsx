import React, {useEffect, useLayoutEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";
import {useTexture} from "@react-three/drei";
import vertexShader from '../../_shaders/vertex.glsl';
import fragmentShader from '../../_shaders/fragment.glsl';

export default function Reticular() {
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const secondHeight = useMeasurementsStore((state: State) => state.secondHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);

    const ref = useRef<THREE.Mesh|null>(null);
    const sourceTexture = useTexture('/zigzag2.webp');
    const texture = useMemo(() => {
        const configuredTexture = sourceTexture.clone();
        configuredTexture.colorSpace = THREE.SRGBColorSpace;
        configuredTexture.wrapS = THREE.RepeatWrapping;
        configuredTexture.repeat.set(5, 1);
        configuredTexture.needsUpdate = true;
        return configuredTexture;
    }, [sourceTexture]);

    useEffect(() => () => texture.dispose(), [texture]);

    const requiredValues = getDefinedValues({
        pillarsHeight,
        width,
        length,
        roofInclineRad: roofIncline.rad,
        interaxleLength,
        pillars
    });

    if (!requiredValues) return null;

    const RETICULAR = () => {
        const {pillars, length, interaxleLength, width, roofInclineRad, pillarsHeight} = requiredValues;
        const hasSecondHeight = secondHeight !== undefined;
        const frames = (length / interaxleLength) + 1;
        const leftPillarIndex = hasSecondHeight ? Math.floor(pillars / 2) - 1 : 0;
        const rightPillarIndex = hasSecondHeight ? Math.floor(pillars / 2) : pillars - 1;
        const leftX = pillarsHeight[leftPillarIndex].position! - (width / 2);
        const rightX = pillarsHeight[rightPillarIndex].position! - (width / 2);
        const leftHeight = pillarsHeight[leftPillarIndex].totalHeight as number;
        const rightHeight = pillarsHeight[rightPillarIndex].totalHeight as number;
        const ridgeX = (leftX + rightX) / 2;
        const ridgeHeight = leftHeight + (ridgeX - leftX) * Math.tan(roofInclineRad);

        const vertices = new Float32Array([
            leftX, leftHeight, 0.0,
            rightX, rightHeight, 0.0,
            ridgeX, ridgeHeight, 0.0
        ]);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute([
            0, 0,
            1, 0,
            0.5, 1
        ], 2));

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTexture: {value: texture}
            },
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false
        });

        useLayoutEffect(() => {
            if (!ref.current) return;

            const {interaxleLength} = requiredValues;
            const mesh = new THREE.Object3D();

            for (let i = 0; i < frames; i++) {
                mesh.position.set(0, 0, -interaxleLength * i);
                mesh.updateMatrix();
                (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
            }

        }, [frames, interaxleLength]);

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[geometry, material, frames]}>
            </instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <RETICULAR/>
}
