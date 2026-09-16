import { create } from 'zustand';
import {produce} from "immer";
import {Pillar, State} from "@/app/_types/State";


export const useMeasurementsStore = create<State>((set, get) => ({

    // GEOMETRY
    geometry: undefined,
    setGeometry: (geometry) => set({geometry:geometry}),
    // BASE MEASUREMENTS
    pillars: undefined,
    sails: undefined,
    pitches: undefined,
    structureType: undefined,
    eavesHeight: undefined,
    secondHeight: undefined,
    length: undefined,
    width: undefined,
    interaxleLength: undefined,
    interaxleWidth: undefined,
    overhangLeft: undefined,
    overhangRight: undefined,
    domeType: undefined,
    purlinType: undefined,
    purlinShape: undefined,
    // OBJECT: %, grad e rad
    // TECNICAMENTE, anche questo sarebbe derivabile,
    // MA devono avere la possibilità di inserire misure arbitrarie
    roofIncline: {
        percentage: undefined,
        grad: undefined,
        rad: undefined,
    },
    setRoofIncline: (state, n) =>  {
            if(!n) {
                state.roofIncline.percentage = undefined;
                state.roofIncline.grad = undefined;
                state.roofIncline.rad = undefined;
            } else {
                state.roofIncline.percentage = n;
                state.roofIncline.grad = Math.atan(n/100) * (180/Math.PI);
                state.roofIncline.rad = Math.atan(n/100);
            }
        },
    secondRoofIncline: {
        percentage: undefined,
        grad: undefined,
        rad: undefined,
    },
    setSecondRoofIncline: (state, n) =>  {
        if(!n) {
            state.secondRoofIncline.percentage = undefined;
            state.secondRoofIncline.grad = undefined;
            state.secondRoofIncline.rad = undefined;
        } else {
            state.secondRoofIncline.percentage = n;
            state.secondRoofIncline.grad = Math.atan(n/100) * (180/Math.PI);
            state.secondRoofIncline.rad = Math.atan(n/100);
        }
    },

    // FUNCTION TO SET BASE MEASUREMENTS
    setBaseMeasurements: (measurements) =>
        set(
            produce((state) => {
                if(Number(measurements.spansRight) === 1 && Number(measurements.spansLeft) === 1) {
                    return;
                }

                state.pillars = Number(measurements.pillars);
                state.pitches = measurements.pitches;
                state.domeType = measurements.dome;
                state.purlinType = measurements.purlin;
                state.purlinShape = measurements.purlinShape;
                state.overhangRight = measurements.overhangRight;
                state.overhangLeft = measurements.overhangLeft;

                state.coveringType.type = measurements.coveringType;
                if(measurements.coveringSubType !== '') {
                    state.coveringType.subType = measurements.coveringSubType;
                } else {
                    state.coveringType.subType = undefined;
                }
                if(measurements.thicknessTop !== '') {
                    state.coveringType.thickness.top = Number(measurements.thicknessTop);
                } else {
                    state.coveringType.thickness.top = undefined;
                }
                if(measurements.thicknessBottom !== '') {
                    state.coveringType.thickness.bottom = Number(measurements.thicknessBottom);
                } else {
                    state.coveringType.thickness.bottom = undefined;
                }

                if(measurements.spansRight) {
                    state.spansRight = Number(measurements.spansRight);
                }

                if(measurements.spansLeft) {
                    state.spansLeft = Number(measurements.spansLeft);
                }

                if(state.spansLeft || state.spansRight) {
                    state.sails = ((state.spansLeft ?? 0) + (state.spansRight ?? 0) + 1);
                }

                if(state.pillars !== 10) {
                    state.spansRight = undefined;
                    state.spansLeft = undefined;
                    state.sails = undefined;
                }

                // EXCEPTION: 3 PILLARS + SHED
                if(state.pitches === 'S') {
                    state.structureType = measurements.structureType;
                    get().setRoofIncline(state, 15);
                    get().setSecondRoofIncline(state, 25);
                // EXCEPTION: SAILS
                } else if(state.pillars === 10){
                    state.structureType = 'sails';
                    get().setRoofIncline(state, 15);
                    state.secondRoofIncline = {
                        percentage: undefined,
                        grad: undefined,
                        rad: undefined,
                    }
                // ALL OTHER CASES
                } else {
                    // EXCEPTION: 1, 2 PILLARS
                    if(state.pillars < 3) {
                        state.structureType = 'struts';
                    } else {
                        state.structureType = measurements.structureType;
                    }
                    get().setRoofIncline(state, Number(measurements.roofIncline));
                    state.secondRoofIncline = {
                        percentage: undefined,
                        grad: undefined,
                        rad: undefined,
                    }
                }

                state.eavesHeight = Number(measurements.eavesHeight);
                if(measurements.secondHeight !== '' && measurements.pitches === 'DH') {
                    state.secondHeight = Number(measurements.secondHeight);
                } else {
                    state.secondHeight = undefined;
                }

                state.length = Number(measurements.length);
                state.width = Number(measurements.width);
                state.overhangRight = Number(measurements.overhangRight);
                state.overhangLeft = Number(measurements.overhangLeft);
                state.interaxleLength = Number(measurements.interaxleLength);
                state.interaxleWidth = state.sails ? Number(measurements.width) / Number(state.sails) : Number(measurements.width) / Number(measurements.pillars);

                get().setDerivedMeasurements(state);
            })),

    // FUNCTION TO DERIVE MEASUREMENTS
    setDerivedMeasurements: (state) => {
        state.secondHeightOffset = 0;

        if(state.width && state.roofIncline.percentage && state.pillars
            && state.interaxleWidth && state.eavesHeight && state.overhangRight && state.overhangLeft) {
            state.pillarsHeight = [];

            const halfWidth = state.width / 2;
            const halfRight = halfWidth + state.overhangRight;
            const halfLeft = halfWidth + state.overhangLeft;

            state.secondHeightOffset = state.secondHeight && state.pillars > 3 && state.pitches === 'DH'
                ? (halfWidth - ((state.interaxleWidth / 2) + 0.5)) * Math.tan(state.roofIncline.rad!) + state.secondHeight
                : 0;

            // BEAM (PER ORA LE ECCEZIONI CONTINUANO A USARE HALFWIDTH)
            // EXCEPTION: 1 o 2 PILLARS MONO FALDA
            if(state.pillars < 3 && state.pitches?.includes('M')) {
                state.beamMaxHeight = (state.roofIncline.percentage * state.width) / 100;
                state.beamLength = Math.sqrt(Math.pow(state.beamMaxHeight, 2) + Math.pow(state.width, 2));
            // EXCEPTION: SAILS
            } else if(state.pillars === 10) {
                const firstSpans = {beamLength: 0, beamMaxHeight: 0, halfPurlins: 0};
                const middleSpans = {beamLength: 0, beamMaxHeight: 0, halfPurlins: 0};
                const nearCentralSpans = {beamLength: 0, beamMaxHeight: 0, halfPurlins: 0};
                const centralSpan = {beamLength: 0, beamMaxHeight: 0, halfPurlins: 0};

                firstSpans.beamMaxHeight = (state.roofIncline.percentage * (1.0 + state.interaxleWidth/2 + state.interaxleWidth)) / 100;
                firstSpans.beamLength = Math.sqrt(Math.pow(firstSpans.beamMaxHeight, 2) + Math.pow((1.0 + state.interaxleWidth/2 + state.interaxleWidth), 2));
                firstSpans.halfPurlins = Math.ceil(firstSpans.beamLength / 1.5);
                middleSpans.beamMaxHeight = (state.roofIncline.percentage * (1.0 + state.interaxleWidth)) / 100;
                middleSpans.beamLength = Math.sqrt(Math.pow(middleSpans.beamMaxHeight, 2) + Math.pow((1.0 + state.interaxleWidth), 2));
                middleSpans.halfPurlins = Math.ceil(middleSpans.beamLength / 1.5);
                nearCentralSpans.beamMaxHeight = (state.roofIncline.percentage * (state.interaxleWidth)) / 100;
                nearCentralSpans.beamLength = Math.sqrt(Math.pow(nearCentralSpans.beamMaxHeight, 2) + Math.pow((state.interaxleWidth), 2));
                nearCentralSpans.halfPurlins = Math.ceil(nearCentralSpans.beamLength / 1.5);
                centralSpan.beamMaxHeight = (state.roofIncline.percentage * (2.0 + state.interaxleWidth)) / 100;
                centralSpan.beamLength = Math.sqrt(Math.pow(centralSpan.beamMaxHeight, 2) + Math.pow((2.0 + state.interaxleWidth), 2));
                centralSpan.halfPurlins = Math.ceil(centralSpan.beamLength / 1.5);

                state.spansInfo.beams = {firstSpans, middleSpans, nearCentralSpans, centralSpan};

                // EXCEPTION: >4 PILLARS DOUBLE HEIGHT
            } else if(state.pillars > 3 && state.pitches?.includes('D')) {
                state.beamMaxHeight = (state.roofIncline.percentage * halfWidth) / 100;
                state.beamRightLength = Math.sqrt(Math.pow(state.beamMaxHeight, 2) + Math.pow(halfRight, 2));
                state.beamLeftLength = Math.sqrt(Math.pow(state.beamMaxHeight, 2) + Math.pow(halfLeft, 2));

                state.beamMaxHeightDH = (state.roofIncline.percentage * (halfWidth - state.interaxleWidth/2)) / 100;
                state.beamLengthDH = Math.sqrt(Math.pow(state.beamMaxHeightDH, 2) + Math.pow(halfWidth - state.interaxleWidth/2, 2));
                state.coveringLengthDH = state.beamLengthDH;
                state.halfPurlinsDH = Math.ceil(state.coveringLengthDH / 1.5);
            // ALL OTHER CASES
            } else {
                state.beamMaxHeight = (state.roofIncline.percentage * halfWidth) / 100;
                state.beamRightLength = Math.sqrt(Math.pow(state.beamMaxHeight, 2) + Math.pow(halfRight, 2));
                state.beamLeftLength = Math.sqrt(Math.pow(state.beamMaxHeight, 2) + Math.pow(halfLeft, 2));
            }
            // ADD-ON: 3 PILLARS + SHED
            if(state.pitches === 'S' && state.secondRoofIncline.percentage) {
                state.secondBeamMaxHeight = (state.secondRoofIncline.percentage * halfWidth) / 100;
                state.secondBeamLength = Math.sqrt(Math.pow(state.secondBeamMaxHeight, 2) + Math.pow(halfWidth, 2)) + state.overhangLeft;
                state.secondCoveringLength = state.secondBeamLength;
                state.secondHalfPurlins = Math.ceil(state.secondCoveringLength / 1.5);
            } else {
                state.secondBeamMaxHeight = undefined;
                state.secondBeamLength = undefined;
                state.secondCoveringLength = undefined;
                state.secondHalfPurlins = undefined;
            }

            // DOME
            // SOLO SE !== 1 o 2 PILLARS MONO FALDA, 3 PILLARS + SHED
            if(state.pillars === 10 || (state.pitches && (state.pillars === 1 || (state.pillars === 2 && state.pitches.includes('M')) || (state.pillars === 3 && state.pitches.includes('S'))))) {
                state.domeWidth = undefined;
                state.domeHeight = undefined;
            } else {
                // height
                if (state.width >= 10 && state.width < 35) {
                    state.domeHeight = 0.5;
                } else {
                    state.domeHeight = 0.6;
                }
                // width
                if (state.width <= 10) {
                    state.domeWidth = 1;
                } else if (state.width >= 60) {
                    state.domeWidth = 5;
                } else {
                    state.domeWidth = 0.08 * state.width + 0.2;
                }
            }

            // COVERING LENGTH
            // EXCEPTIONS: 1 o 2 PILLARS MONOFALDA, 3 PILLARS + SHED
            if(state.pitches && (state.pillars === 1 || (state.pillars === 2 && state.pitches.includes('M')))) {
                state.coveringLength = state.beamLength;
            // ALL OTHER CASES
            } else if(state.pillars !== 10){
                state.coveringRightLength = state.beamRightLength! - (state.domeWidth! / 2);
                state.coveringLeftLength = state.beamLeftLength! - (state.domeWidth! / 2);
            }

            if(state.pillars !== 10) {
                state.halfRightPurlins = Math.ceil(state.coveringRightLength! / 1.5);
                state.halfLeftPurlins = Math.ceil(state.coveringRightLength! / 1.5);
            }

            const halfPillars = Math.ceil(Number(state.pillars) / 2);

            // pillars height, BUT ALSO pillars position
            for(let i= 0; i < (state.pillars === 10 ? state.sails! : state.pillars); i++) {
                    const pillar:Pillar = {
                        heightToAdd: undefined,
                        totalHeight: undefined,
                        position: undefined
                    };
                    // POSITION
                    pillar.position = state.interaxleWidth/2 + (state.interaxleWidth * i);

                    // HEIGHT
                    // EXCEPTION: SAILS
                    if(state.sails && state.pillars === 10) {

                        if(state.spansRight && state.spansRight === 1 &&  state.spansLeft && state.spansLeft > 2) {
                                if(i === 0) {
                                    pillar.heightToAdd = (state.roofIncline.percentage * pillar.position) / 100;
                                } else if(i === state.sails - 1) {
                                    pillar.heightToAdd = state.pillarsHeight[0].heightToAdd;
                                } else if(i === 1) {
                                    pillar.heightToAdd = (state.roofIncline.percentage * state.interaxleWidth) / 100 + (state.roofIncline.percentage * pillar.position) / 100;
                                } else if(i === 2) {
                                    pillar.heightToAdd = (state.roofIncline.percentage * state.pillarsHeight[1].position!) / 100;
                                } else if(i === state.sails - 2) {
                                    pillar.heightToAdd = (state.roofIncline.percentage * state.pillarsHeight[1].position!) / 100;
                                } else {
                                    pillar.heightToAdd = (state.roofIncline.percentage * state.interaxleWidth) / 100;
                                }
                                pillar.totalHeight = state.eavesHeight + pillar.heightToAdd!;

                        } else if(state.spansRight && state.spansRight === 1 &&  state.spansLeft && state.spansLeft === 2) {
                            if(i === 0) {
                                pillar.heightToAdd = (state.roofIncline.percentage * pillar.position) / 100;
                            } else if(i === state.sails - 1) {
                                pillar.heightToAdd = state.pillarsHeight[0].heightToAdd;
                            } else if(i === 1) {
                                pillar.heightToAdd = (state.roofIncline.percentage * state.interaxleWidth) / 100 + (state.roofIncline.percentage * pillar.position) / 100 + 0.5;
                            } else {
                                pillar.heightToAdd = (state.roofIncline.percentage * state.pillarsHeight[1].position!) / 100 + 0.5;
                            }
                            pillar.totalHeight = state.eavesHeight + pillar.heightToAdd!;

                        } else {
                            if(i === 0 || i === 1) {
                                pillar.heightToAdd = (state.roofIncline.percentage * pillar.position) / 100;
                            } else if(state.spansLeft && i === state.sails - 1) {
                                pillar.heightToAdd = state.pillarsHeight[0].heightToAdd;
                            } else if(state.spansLeft && (i === state.sails - 2 || i === state.sails - state.spansLeft)) {
                                if(state.spansLeft === 2) {
                                    pillar.heightToAdd = state.pillarsHeight[1].heightToAdd! + 0.5;
                                } else {
                                    pillar.heightToAdd = state.pillarsHeight[1].heightToAdd;
                                }
                            } else {
                                pillar.heightToAdd = (state.roofIncline.percentage * state.interaxleWidth) / 100;
                            }
                            if(state.spansLeft && i === state.sails - state.spansLeft - 1) {
                                if(state.spansLeft === 2) {
                                    pillar.totalHeight = state.pillarsHeight[1].totalHeight! + pillar.heightToAdd! + 0.5;
                                } else {
                                    if(state.spansLeft !== 1) {
                                        pillar.totalHeight = state.pillarsHeight[1].totalHeight! + pillar.heightToAdd!;
                                    } else {
                                        pillar.totalHeight = state.pillarsHeight[1].totalHeight;
                                    }
                                }
                            } else {
                                pillar.totalHeight = state.eavesHeight + pillar.heightToAdd!;
                            }
                        }

                    // EXCEPTION: 2 PILLARS MONO FALDA
                    } else if(state.pitches && (state.pillars === 2 && state.pitches.includes('M'))) {
                        pillar.heightToAdd = (state.roofIncline.percentage * pillar.position) / 100;
                        pillar.totalHeight = state.eavesHeight + pillar.heightToAdd;
                    // EXCEPTION: 3 PILLARS SHED
                    } else if(state.pitches === 'S' && state.secondRoofIncline.percentage){
                        if(i < halfPillars) {
                            pillar.heightToAdd = (state.secondRoofIncline.percentage * pillar.position) / 100;
                        } else {
                            pillar.heightToAdd = (state.roofIncline.percentage * state.pillarsHeight[0].position!) / 100;
                        }
                        pillar.totalHeight = state.eavesHeight + pillar.heightToAdd;

                    // EXCEPTION: 3 PILLARS NORMAL
                    } else if(state.pillars === 3) {
                        if(i < halfPillars) {
                            pillar.heightToAdd = (state.roofIncline.percentage * pillar.position) / 100;
                            pillar.totalHeight = state.eavesHeight + pillar.heightToAdd;
                        } else {
                            pillar.heightToAdd = state.pillarsHeight[0].heightToAdd;
                            pillar.totalHeight = state.pillarsHeight[0].totalHeight;
                        }
                    } else {
                        if(i < halfPillars) {
                            if(state.secondHeight && i === halfPillars - 1) {
                                pillar.heightToAdd = ((state.roofIncline.percentage * pillar.position) / 100) + state.secondHeight;
                            } else {
                                pillar.heightToAdd = (state.roofIncline.percentage * pillar.position) / 100;
                            }
                            pillar.totalHeight = state.eavesHeight + pillar.heightToAdd;
                        } else {
                            pillar.heightToAdd = state.pillarsHeight[i - 1 - (2 * (i - halfPillars))].heightToAdd;
                            pillar.totalHeight = state.pillarsHeight[i - 1 - (2 * (i - halfPillars))].totalHeight;
                        }
                    }
                    state.pillarsHeight.push(pillar);
                }
            }

            if(state.sails && state.pillars === 10 && state.length && state.width && state.interaxleLength) {
                const basesInfo = [];

                for (let i = 0; i < (state.sails * (state.length / state.interaxleLength)) + state.sails; i++) {
                    const position = [
                        state.pillarsHeight![i - (state.sails * Math.floor(i / state.sails))].position! - (state.width / 2),
                        0,
                        -state.interaxleLength * Math.floor(i / state.sails)
                    ];
                    basesInfo.push({index: i, position})
                }
                state.instancesInformation.pillars = basesInfo;
            }
    },

    // DERIVED MEASUREMENTS
    spansRight: undefined,
    spansLeft: undefined,
    spansInfo: {beams: undefined},
    beamMaxHeight: undefined,
    beamLength: undefined,
    beamRightLength: undefined,
    beamLeftLength: undefined,
    coveringRightLength: undefined,
    coveringLeftLength: undefined,
    beamMaxHeightDH: undefined,
    beamLengthDH: undefined,
    coveringLengthDH: undefined,
    secondBeamMaxHeight: undefined,
    secondBeamLength: undefined,
    beamPatchLength: undefined,
    coveringLength: undefined,
    secondCoveringLength: undefined,
    halfPurlins: undefined,
    halfRightPurlins: undefined,
    halfLeftPurlins: undefined,
    halfPurlinsDH: undefined,
    secondHalfPurlins: undefined,
    domeHeight: undefined,
    domeWidth: undefined,
    secondHeightOffset: 0,
    coveringType: {
        type: undefined,
        subType: undefined,
        thickness: {
            top: undefined,
            bottom: undefined
        }
    },
    pillarsHeight: undefined,
    instancesInformation: {pillars: undefined},
    instanceShown: undefined,
    setInstanceShown: (n) => set({instanceShown:n}),
}))
