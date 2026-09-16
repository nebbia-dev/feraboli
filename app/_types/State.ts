import * as THREE from "three";

export type Geometry = {
    domeCoveringSpherical: THREE.BufferGeometry,
    domeCoveringRight: THREE.BufferGeometry,
    domeCoveringLeft: THREE.BufferGeometry,
    domeCoveringFCRight: THREE.BufferGeometry,
    domeCoveringFCLeft: THREE.BufferGeometry,
    domeCoveringLamRight: THREE.BufferGeometry,
    domeCoveringLamLeft: THREE.BufferGeometry,
    domePurlinsRight: THREE.BufferGeometry,
    domePurlinsCentral: THREE.BufferGeometry,
    domePurlinsLeft: THREE.BufferGeometry,
    domePurlinsOmegaCentral: THREE.BufferGeometry,
    domePurlinsOmega: THREE.BufferGeometry,
    domeBeamsRight: THREE.BufferGeometry,
    domeBeamsLeft: THREE.BufferGeometry,
    domePillarsRight: THREE.BufferGeometry,
    domePillarsLeft: THREE.BufferGeometry,
    coveringRight: THREE.BufferGeometry,
    coveringLeft: THREE.BufferGeometry,
    coveringFCRight: THREE.BufferGeometry,
    coveringFCLeft: THREE.BufferGeometry,
    coveringLamRight: THREE.BufferGeometry,
    coveringLamLeft: THREE.BufferGeometry,
    purlinsOmega: THREE.BufferGeometry,
    purlinsRight: THREE.BufferGeometry,
    purlinsLeft: THREE.BufferGeometry,
    beamsRight: THREE.BufferGeometry,
    beamsLeft: THREE.BufferGeometry,
    capitalPortalSOpp: THREE.BufferGeometry,
    capitalPortalS: THREE.BufferGeometry,
    capitalPortalD: THREE.BufferGeometry,
    capitalStrutsSOpp: THREE.BufferGeometry,
    capitalStrutsS: THREE.BufferGeometry,
    capitalStrutsD: THREE.BufferGeometry,
    pillars: THREE.BufferGeometry,
    bases: THREE.BufferGeometry,
}
export interface Measurements {
    pillars: string,
    pitches: string,
    structureType: string,
    roofIncline: string,
    eavesHeight: string,
    secondHeight: string,
    length: string,
    width: string,
    interaxleLength: string,
    dome: string,
    purlin: string,
    purlinShape: string,
    spansRight: string,
    spansLeft: string,
    coveringType: string,
    coveringSubType: string,
    thicknessTop: string,
    thicknessBottom: string,
    overhangLeft: string,
    overhangRight: string
}
export interface Pillar {
    heightToAdd: number | undefined,
    totalHeight: number | undefined,
    position: number | undefined
}
export interface InstanceInformation {
    index: number,
    position: number[]
}
export interface SpanInformation {
    beamLength: number,
    beamMaxHeight: number,
    halfPurlins: number
}
export interface State {
    geometry: Geometry | undefined,
    setGeometry: (geometry:Geometry) => void,
    pillars: number | undefined,
    sails: number | undefined,
    pitches: string | undefined,
    structureType: string | undefined,
    eavesHeight: number | undefined,
    secondHeight: number | undefined,
    length: number | undefined,
    width: number | undefined,
    interaxleLength: number | undefined,
    interaxleWidth: number | undefined,
    overhangLeft: number | undefined,
    overhangRight: number | undefined,
    beamRightLength: number | undefined,
    beamLeftLength: number | undefined,
    coveringRightLength: number | undefined,
    coveringLeftLength: number | undefined,
    domeType: string | undefined,
    purlinType: string | undefined,
    purlinShape: string | undefined,
    roofIncline: {
        percentage: number | undefined,
        grad: number | undefined,
        rad: number | undefined,
    },
    setRoofIncline: (state:State, n:number|undefined) => void,
    secondRoofIncline: {
        percentage: number | undefined,
        grad: number | undefined,
        rad: number | undefined,
    },
    setSecondRoofIncline: (state:State, n:number|undefined) => void,

    setBaseMeasurements: (measurements:Measurements) => void,
    setDerivedMeasurements: (state:State) => void,

    spansRight: number | undefined,
    spansLeft: number | undefined,
    spansInfo: {
        beams: {
            firstSpans: SpanInformation,
            middleSpans: SpanInformation,
            nearCentralSpans: SpanInformation,
            centralSpan: SpanInformation
        } | undefined
    },
    beamMaxHeight: number | undefined,
    beamLength: number | undefined,
    beamMaxHeightDH: number | undefined,
    beamLengthDH: number | undefined,
    secondBeamMaxHeight: number | undefined,
    secondBeamLength: number | undefined,
    beamPatchLength: number | undefined,
    coveringLength: number | undefined,
    coveringLengthDH: number | undefined,
    secondCoveringLength: number | undefined,
    halfPurlinsDH: number | undefined,
    halfPurlins: number | undefined,
    halfRightPurlins: number | undefined,
    halfLeftPurlins: number | undefined,
    secondHalfPurlins: number | undefined,
    domeHeight: number | undefined,
    domeWidth: number | undefined,
    secondHeightOffset: number,
    coveringType: {
        type: string | undefined,
        subType: string | undefined,
        thickness: {
            top: number | undefined,
            bottom: number | undefined
        }
    }
    pillarsHeight: Pillar[] | undefined,
    instancesInformation: {
        pillars: InstanceInformation[] | undefined
    },
    instanceShown: number | undefined,
    setInstanceShown: (n: number | undefined) => void,
}
