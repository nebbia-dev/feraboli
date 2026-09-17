import React, {useLayoutEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import {InstancedMesh} from "three";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {SpanInformation, State} from "@/app/_types/State";
import {getDefinedValues} from "@/app/_utils/getDefinedValues";

type SpanLengths = {
    firstSpans: SpanInformation,
    middleSpans: SpanInformation,
    nearCentralSpans: SpanInformation,
    centralSpan: SpanInformation
};

function getCoveringSpanLength(
    beamIndex: number,
    lastBeamIndex: number,
    centralBeamIndex: number,
    spansLeft: number | undefined,
    spansRight: number,
    spanLengths: SpanLengths
) {
    if (!spansLeft) {
        return beamIndex === 0
            ? spanLengths.firstSpans.beamLength
            : spanLengths.middleSpans.beamLength;
    }

    if (beamIndex === 0) {
        return spansRight === 1
            ? spanLengths.firstSpans.beamLength - 1.0
            : spanLengths.firstSpans.beamLength;
    }

    if (beamIndex === lastBeamIndex) {
        return spansLeft === 2
            ? spanLengths.firstSpans.beamLength - 1.0
            : spanLengths.firstSpans.beamLength;
    }

    if (beamIndex === centralBeamIndex) {
        return spanLengths.centralSpan.beamLength;
    }

    if (Math.abs(beamIndex - centralBeamIndex) === 1) {
        return spanLengths.nearCentralSpans.beamLength;
    }

    return spanLengths.middleSpans.beamLength;
}

export default function CoveringS({material} : {material : THREE.Material}) {
    const baseModel = useMeasurementsStore((state: State) => state.geometry);
    const coveringType = useMeasurementsStore((state: State) => state.coveringType.type);
    const sails = useMeasurementsStore((state: State) => state.sails);
    const beamLength = useMeasurementsStore((state: State) => state.spansInfo.beams);
    const eavesHeight = useMeasurementsStore((state: State) => state.eavesHeight);
    const spansRight = useMeasurementsStore((state: State) => state.spansRight);
    const spansLeft = useMeasurementsStore((state: State) => state.spansLeft);
    const pillarsHeight = useMeasurementsStore((state: State) => state.pillarsHeight);
    const roofIncline = useMeasurementsStore((state: State) => state.roofIncline);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const interaxleLength = useMeasurementsStore((state: State) => state.interaxleLength);
    const interaxleWidth = useMeasurementsStore((state: State) => state.interaxleWidth);
    const purlinType = useMeasurementsStore((state: State) => state.purlinType);

    const coveringRef = useRef<InstancedMesh|null>(null);
    const coveringGeometry = coveringType === 'L'
        ? baseModel?.coveringLamLeft
        : coveringType === 'FC'
            ? baseModel?.coveringFCLeft
            : baseModel?.coveringLeft;

    const primaryRoofValues = getDefinedValues({
        beamLength,
        eavesHeight,
        pillarsHeight,
        roofInclineRad: roofIncline.rad,
        width,
        length,
        spansRight,
        interaxleLength,
        interaxleWidth,
        sails,
        purlinType
    });
    const requiredValues = primaryRoofValues;

    if (
        !requiredValues
        || !coveringGeometry
    ) {
        return null;
    }

    const BEAMSLEFT = () => {
        const {
            beamLength,
            length,
            interaxleLength,
            sails,
            spansRight
        } = requiredValues;
        const beamsPerRow = sails - 1;
        const lastBeamIndex = beamsPerRow - 1;
        const centralBeamIndex = spansRight;
        const coveringSpanLengths = useMemo(
            () => Array.from(
                {length: beamsPerRow},
                (_, beamIndex) => getCoveringSpanLength(
                    beamIndex,
                    lastBeamIndex,
                    centralBeamIndex,
                    spansLeft,
                    spansRight,
                    beamLength
                )
            ),
            [
                beamLength,
                beamsPerRow,
                centralBeamIndex,
                lastBeamIndex,
                spansRight
            ]
        );
        const fcTilesPerRow = coveringSpanLengths.reduce(
            (total, spanLength) => total + Math.max(1, Math.ceil(spanLength)),
            0
        );
        const zCount = Math.ceil(length);
        const standardRows = Math.ceil(length / interaxleLength);
        const standardCount = standardRows * beamsPerRow;
        const count = coveringType === 'FC'
            ? fcTilesPerRow * zCount
            : standardCount;

        useLayoutEffect(() => {
            const covering = coveringRef.current;
            if (!covering) {
                return;
            }

            if (primaryRoofValues) {
                const {purlinType, spansRight, pillarsHeight, width, eavesHeight, roofInclineRad, interaxleWidth, interaxleLength, sails} = primaryRoofValues;
                const purlinOffset = purlinType === 'light' ? 0.18 : 0;
                const mesh = new THREE.Object3D();
                const beamsPerRow = sails - 1;
                const lastBeamIndex = beamsPerRow - 1;
                const centralBeamIndex = spansRight;
                covering.geometry.computeBoundingBox();
                const shift = covering.geometry.boundingBox?.max.x ?? 0;
                covering.geometry.translate(-shift, 0, 0);
                covering.geometry.attributes.position.needsUpdate = true;

                const setCoveringTransform = (
                    beamIndex: number,
                    spanLength: number,
                    zPosition: number,
                    xIndex?: number
                ) => {
                    let rotation, verticalOffset: number;
                    if(spansLeft && beamIndex >= centralBeamIndex) {
                        rotation = roofInclineRad;
                        verticalOffset = eavesHeight + spanLength * Math.sin(roofInclineRad);
                    } else {
                        rotation = -roofInclineRad;
                        verticalOffset = eavesHeight;
                    }

                    const positionOffset = beamIndex === 0
                        ? interaxleWidth / 2
                        : spansLeft && beamIndex === centralBeamIndex
                            ? 1
                            : spansLeft && beamIndex > centralBeamIndex + 1 && beamIndex < lastBeamIndex
                                ? 1
                                : spansLeft === 2 && beamIndex === lastBeamIndex
                                    ? 0
                                    : spansLeft && spansLeft !== 2 && beamIndex === lastBeamIndex
                                        ? 1
                                        : 0;

                    if(spansLeft && beamIndex === centralBeamIndex) {
                        verticalOffset = pillarsHeight[beamIndex].totalHeight!
                            + positionOffset * Math.tan(roofInclineRad);
                    }

                    const beamPosition = pillarsHeight[beamIndex].position!
                        - (width / 2)
                        - positionOffset;

                    mesh.position.set(
                        beamPosition,
                        verticalOffset - purlinOffset,
                        zPosition
                    );
                    mesh.rotation.set(0, Math.PI, rotation);
                    if (xIndex !== undefined) {
                        mesh.scale.set(
                            Math.min(1, Math.max(spanLength - xIndex, 0)),
                            1,
                            1
                        );
                        mesh.translateX(-xIndex);
                    } else {
                        mesh.scale.set(spanLength, 1, interaxleLength);
                    }
                    mesh.updateMatrix();
                };

                if (coveringType === 'FC') {
                    let instanceIndex = 0;

                    for (let zIndex = 0; zIndex < zCount; zIndex++) {
                        coveringSpanLengths.forEach((spanLength, beamIndex) => {
                            const xCount = Math.max(1, Math.ceil(spanLength));

                            for (let xIndex = 0; xIndex < xCount; xIndex++) {
                                setCoveringTransform(
                                    beamIndex,
                                    spanLength,
                                    -(zIndex + 0.5),
                                    xIndex
                                );
                                covering.setMatrixAt(instanceIndex, mesh.matrix);
                                instanceIndex++;
                            }
                        });
                    }
                } else {
                    for (let i = 0; i < standardCount; i++) {
                        const beamIndex = i % beamsPerRow;
                        const rowIndex = Math.floor(i / beamsPerRow);
                        setCoveringTransform(
                            beamIndex,
                            coveringSpanLengths[beamIndex],
                            -interaxleLength * (rowIndex + 0.5)
                        );
                        covering.setMatrixAt(i, mesh.matrix);
                    }
                }

                covering.instanceMatrix.needsUpdate = true;
            }
        }, [
            count,
            coveringSpanLengths,
            standardCount,
            zCount
        ]);

        return (
            <instancedUniformsMesh
                ref={coveringRef}
                args={[coveringGeometry, material, count]}>
            </instancedUniformsMesh>
        )
    }

    // eslint-disable-next-line react-hooks/static-components
    return <BEAMSLEFT/>
}
