import React, {useEffect, useLayoutEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";
import {useTexture} from "@react-three/drei";
import vertexShader from '../../_shaders/vertex.glsl';
import fragmentShader from '../../_shaders/fragment_half.glsl';

export default function ReticularSingleOpp() {
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
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
        interaxleLength,
        pillars,
        roofInclineRad: roofIncline.rad
    });

    if (!requiredValues) return null;

    const RETICULAR = () => {
        const {pillars, length, interaxleLength, width, roofInclineRad, pillarsHeight} = requiredValues;
        const frames = (length / interaxleLength) + 1;
        const centralPillarIndex = Math.floor(pillars / 2);
        const centralPillarPosition = pillarsHeight[centralPillarIndex].position!;
        const centralX = centralPillarPosition - (width / 2);
        const rightX = pillarsHeight[pillars - 1].position! - (width / 2);
        const baseHeight = pillarsHeight[pillars - 1].totalHeight as number;
        const centralRoofHeight = baseHeight + (rightX - centralX) * Math.tan(roofInclineRad);

        const vertices = new Float32Array([
                rightX, baseHeight, 0.0, // bottom right
                centralX, baseHeight, 0.0, // bottom left
                centralX, centralRoofHeight, 0.0  // top
            ]);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute([
            0, 0,
            1, 0,
            1, 1
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
