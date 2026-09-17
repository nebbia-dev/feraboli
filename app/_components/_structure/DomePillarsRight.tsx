import React, {useLayoutEffect, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";
import {getDomeElevationOffset} from "@/app/_utils/getDomeElevationOffset";

export default function DomePillarsRight({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const coveringLength = useMeasurementsStore((state: State) => state.coveringLength);
    const coveringRightLength = useMeasurementsStore((state: State) => state.coveringRightLength);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const domeHeight = useMeasurementsStore((state: State) => state.domeHeight);
    const domeWidth = useMeasurementsStore((state: State) => state.domeWidth);
    const domeType = useMeasurementsStore((state: State) => state.domeType);
    const beamMaxHeight = useMeasurementsStore((state: State) => state.beamMaxHeight);
    const beamLength = useMeasurementsStore((state: State) => state.beamLength);
    const beamRightLength = useMeasurementsStore((state: State) => state.beamRightLength);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);
    const secondHeightOffset = useMeasurementsStore((state: State) => state.secondHeightOffset);
    const overhangLeft = useMeasurementsStore((state: State) => state.overhangLeft);
    const overhangRight = useMeasurementsStore((state: State) => state.overhangRight);

    const isDoubleHeight = pillars !== undefined && pillars > 3 && pitches === 'DH';
    const activeBeamLength = isDoubleHeight ? beamLength : beamRightLength;
    const activeCoveringLength = isDoubleHeight ? coveringLength : coveringRightLength;
    const domeElevationOffset = getDomeElevationOffset({
        pillars,
        pitches,
        roofInclineRad: roofIncline.rad,
        overhangLeft,
        overhangRight
    });

    const pillarNumber = (width && length && interaxleLength)
                                                ? (width >= 35 ? ((length / interaxleLength) + 1) * 2 : (length / interaxleLength) + 1)
                                                : undefined;

    const ref = useRef<THREE.Mesh|null>(null);
    const domePillarGeometry = baseModel?.domePillarsRight;
    const domeBeamGeometry = baseModel?.domeBeamsRight;
    const mainBeamGeometry = baseModel?.beamsLeft;

    const localPlaneInclined = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    const materialClippedRoof = material.clone();
    materialClippedRoof.clippingPlanes = [localPlaneInclined];
    const requiredValues = getDefinedValues({
        coveringLength: activeCoveringLength,
        eavesHeight,
        roofInclinePercentage: roofIncline.percentage,
        roofInclineRad: roofIncline.rad,
        width,
        interaxleLength,
        beamLength: activeBeamLength,
        beamMaxHeight,
        domeHeight,
        domeWidth,
        domeType,
        pillarNumber,
        pillars,
        domeElevationOffset,
        domeBeamBoundingBox: domeBeamGeometry?.boundingBox,
        mainBeamBoundingBox: mainBeamGeometry?.boundingBox
    });

    if (!requiredValues) return null;

    const DOMEPILLARSRIGHT = () => {
        useLayoutEffect(() => {
            if (!ref.current) return;

            const {
                coveringLength,
                eavesHeight,
                roofInclinePercentage,
                roofInclineRad,
                width,
                interaxleLength,
                beamLength,
                beamMaxHeight,
                domeHeight,
                domeWidth,
                domeType,
                pillarNumber,
                pillars,
                domeElevationOffset,
                domeBeamBoundingBox,
                mainBeamBoundingBox
            } = requiredValues;
            const mesh = new THREE.Object3D();

            const beamPosition = (interaxleWidth && pillars > 3 && pitches === 'DH')
                ? (interaxleWidth / 2) + 0.5
                : (width / 2)

            const pillarLocalHeight =
                ref.current.geometry.boundingBox!.max.y -
                ref.current.geometry.boundingBox!.min.y;

            // Allinea la faccia inferiore del pilastro alla faccia superiore
            // della trave principale, tenendo conto della rotazione di entrambe.
            const pillarVerticalOffset =
                ((domeHeight * pillarLocalHeight) + mainBeamBoundingBox.max.y) /
                Math.cos(roofInclineRad) - domeHeight - 0.25;

            if(width >= 35) {
                for (let i = 0; i < pillarNumber; i++) {
                    mesh.scale.y = domeHeight;
                    const shift = ref.current.geometry.boundingBox!.max.y;
                    ref.current.geometry.translate(0, -shift, 0);
                    if(i % 2 === 0) {
                        mesh.position.set(-(beamLength - coveringLength) / 3, eavesHeight + secondHeightOffset + domeHeight + 0.25 + pillarVerticalOffset + ((roofInclinePercentage * (beamPosition - ((beamLength - coveringLength) / 3))) / 100), -interaxleLength * (i/2));
                    } else {
                        mesh.position.set((-(beamLength - coveringLength) / 3) * 2, eavesHeight + secondHeightOffset + domeHeight + 0.25 + pillarVerticalOffset + ((roofInclinePercentage * (beamPosition - ((beamLength - coveringLength) / 3) * 2)) / 100), -interaxleLength * ((i-1)/2));
                    }

                    mesh.rotation.set(0, Math.PI, -roofInclineRad);
                    ref.current.geometry.attributes.position.needsUpdate = true;
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }
            } else {
                for (let i = 0; i < pillarNumber; i++) {
                    mesh.scale.y = domeHeight;
                    const shift = ref.current.geometry.boundingBox!.max.y;
                    ref.current.geometry.translate(0, -shift, 0);
                    mesh.position.set(-(beamLength - coveringLength) / 2, eavesHeight+ secondHeightOffset + domeHeight + 0.25 + pillarVerticalOffset + ((roofInclinePercentage * (beamPosition - ((beamLength - coveringLength) / 2))) / 100), -interaxleLength * i);
                    mesh.rotation.set(0, Math.PI, -roofInclineRad);
                    ref.current.geometry.attributes.position.needsUpdate = true;
                    mesh.updateMatrix();
                    (ref.current as InstancedMesh).setMatrixAt(i, mesh.matrix);
                }
            }

            const isMonoDome = domeType === 'S';
            const ip = (domeWidth / 2) / Math.cos(roofInclineRad);
            const hToAdd = ip * Math.sin(roofInclineRad);
            const beamMatrix = new THREE.Matrix4().compose(
                new THREE.Vector3(
                    isMonoDome ? domeWidth / 2 : 0.05,
                    eavesHeight + beamMaxHeight + secondHeightOffset + domeHeight + 0.25 +
                        (isMonoDome ? hToAdd : 0) + domeElevationOffset,
                    0
                ),
                new THREE.Quaternion().setFromEuler(
                    new THREE.Euler(0, 0, roofInclineRad)
                ),
                new THREE.Vector3(
                    isMonoDome
                        ? domeWidth / Math.cos(roofInclineRad)
                        : domeWidth / 2 + 0.05,
                    1,
                    1
                )
            );

            // Taglia il pilastro sulla faccia inferiore della trave superiore.
            localPlaneInclined
                .set(
                    new THREE.Vector3(0, -1, 0),
                    domeBeamBoundingBox.min.y
                )
                .applyMatrix4(beamMatrix);
        }, []);

        return (
            <instancedUniformsMesh ref={ref}
                                   args={[domePillarGeometry, materialClippedRoof, requiredValues.pillarNumber]}></instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <DOMEPILLARSRIGHT/>
}
