import React, {useCallback, useEffect, useRef, useState} from "react";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {Measurements, State} from "@/app/_types/State";
import {Accordion, AccordionDetails, AccordionSummary, FormControl, MenuItem, Select} from "@mui/material";
import {ExpandMore} from '@mui/icons-material';
import Image from "next/image";

export default function MeasurementsInput() {
    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const setBaseMeasurements = useMeasurementsStore((state: State) => state.setBaseMeasurements);
    const spansLeft = useMeasurementsStore((state: State) => state.spansLeft);
    const spansRight = useMeasurementsStore((state: State) => state.spansRight);


    const [customTab, setCustomTab] = useState(0);
    const [geometryTab, setGeometryTab] = useState(0);
     const updateModelAfterSpanEdit = useRef(false);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setCustomTab(newValue);
    };
    const handleChangeGeometryTab = (event: React.SyntheticEvent, newValue: number) => {
        setGeometryTab(newValue);
    };

    const [measurements, setMeasurements] = useState<Measurements>({
        pillars: '',
        pitches: '',
        structureType: '',
        roofIncline: '',
        eavesHeight: '',
        secondHeight: '',
        length: '',
        width: '',
        interaxleLength: '',
        dome: '',
        purlin: '',
        purlinShape:'',
        spansRight: '',
        spansLeft: '',
        coveringType: '',
        coveringSubType: '',
        thicknessTop: '',
        thicknessBottom: '',
        overhangLeft: '',
        overhangRight: ''
    });

    function editPillars(n:number) {
        switch(n) {
            case 0:
                let newMinValue;
                switch(measurements.pillars) {
                    case '1':
                    case '':
                        newMinValue = '10';
                        break;
                    case '10':
                        newMinValue = '8';
                        break;
                    case '6':
                        newMinValue = '4';
                        break;
                    case '8':
                        newMinValue = '6';
                        break;
                    default:
                        newMinValue = (Number(measurements.pillars) - 1).toString();
                }
                setMeasurements({...measurements, pillars: newMinValue, pitches: ''});
                break;
            case 1:
                let newMaxValue;
                switch(measurements.pillars) {
                    case '8':
                        newMaxValue = '10';
                        break;
                    case '10':
                        newMaxValue = '1';
                        break;
                    case '4':
                        newMaxValue = '6';
                        break;
                    case '6':
                        newMaxValue = '8';
                        break;
                    default:
                        newMaxValue = (Number(measurements.pillars) + 1).toString();
                }
                setMeasurements({...measurements, pillars: newMaxValue, pitches: ''});
                break;
        }
    }
    function editSpans(n:number, side:string) {
        // EXCEPTION: avoid 1 sail per side
        if((n === 0 && side === 'right' && measurements.spansRight === '2' && measurements.spansLeft === '1')
        || (n === 0 && side === 'left' && measurements.spansLeft === '2' && measurements.spansRight === '1')) {
            return;
        }

        // EXCEPTION: avoid left sails if right sails are 1 or less
        if(n === 1 && side === 'left'
            && (measurements.spansLeft === '' || measurements.spansLeft === '1')
            && (measurements.spansRight === '' || measurements.spansRight === '1')) {
            return;
        }

        if(n === 0 && side === 'left' && measurements.spansLeft === '' && measurements.spansRight === '') {
            return;
        }


        switch(n) {
            case 0:
                let newMinValue;
                if(side === 'right') {
                    switch(measurements.spansRight) {
                        case '':
                            newMinValue = '10';
                            break;
                        case '1':
                            newMinValue = '';
                            break;
                        default:
                            newMinValue = (Number(measurements.spansRight) - 1).toString();
                    }
                    setMeasurements({...measurements, spansRight: newMinValue});
                } else {
                    switch(measurements.spansLeft) {
                        case '':
                            newMinValue = '10';
                            break;
                        case '1':
                            newMinValue = '';
                            break;
                        default:
                            newMinValue = (Number(measurements.spansLeft) - 1).toString();
                    }
                    setMeasurements({...measurements, spansLeft: newMinValue});
                }
                break;
            case 1:
                let newMaxValue;
                if(side === 'right') {
                    switch(measurements.spansRight) {
                        case '10':
                            newMaxValue = '';
                            break;
                        case '':
                            newMaxValue = '1';
                            break;
                        default:
                            newMaxValue = (Number(measurements.spansRight) + 1).toString();
                    }
                    setMeasurements({...measurements, spansRight: newMaxValue});
                } else {
                    switch(measurements.spansLeft) {
                        case '10':
                            newMaxValue = '';
                            break;
                        case '':
                            newMaxValue = '1';
                            break;
                        default:
                            newMaxValue = (Number(measurements.spansLeft) + 1).toString();
                    }
                    setMeasurements({...measurements, spansLeft: newMaxValue});
                }
                break;
        }
    }
    function editPitches(n:number, pillars:number) {
        let pitches:string[]|undefined;
        const pitchesOne = ["M", "D"];
        const pitchesTwo = ["M", "D"];
        // const pitchesTwo = ["M", "M1B", "M2B", "D"];
        const pitchesThree = ["D", "S"];
        const pitchesFour = ["M", "DH"]

        switch(pillars) {
            case 1:
                pitches = pitchesOne;
                break;
            case 2:
                pitches = pitchesTwo;
                break;
            case 3:
                pitches = pitchesThree;
                break;
            default:
                pitches = pitchesFour;
        }

        if(pitches.length === 0 || !pitches) {
            return;
        }

        switch(n) {
            case 0:
                let newMinValue;
                if(measurements.pitches === '') {
                    newMinValue = pitches[pitches.length - 1];
                } else if(pitches.indexOf(measurements.pitches as string) === 0) {
                    newMinValue = pitches[pitches.length - 1];
                } else {
                    newMinValue = pitches[pitches.indexOf(measurements.pitches  as string) - 1]
                }
                setMeasurements({...measurements, pitches: newMinValue});
                break;
            case 1:
                let newMaxValue;
                if(measurements.pitches === '') {
                    newMaxValue = pitches[0];
                } else if(pitches.indexOf(measurements.pitches  as string) === pitches.length - 1) {
                    newMaxValue = pitches[0];
                } else {
                    newMaxValue = pitches[pitches.indexOf(measurements.pitches  as string) + 1]
                }
                setMeasurements({...measurements, pitches: newMaxValue});
                break;
            }
    }
    function editStructures(n:number) {
        const structures = ["portal", "struts", "tieBeam", "reticular"];

        if(structures.length === 0 || !structures) {
            return;
        }

        switch(n) {
            case 0:
                let newMinValue, roofInclineMin;
                if(measurements.structureType === '') {
                    newMinValue = structures[structures.length - 1];
                } else if(structures.indexOf(measurements.structureType as string) === 0) {
                    newMinValue = structures[structures.length - 1];
                } else {
                    newMinValue = structures[structures.indexOf(measurements.structureType as string) - 1]
                }

                switch(newMinValue) {
                    case 'portal':
                        roofInclineMin = '25';
                        break;
                    case 'struts':
                        roofInclineMin = '25';
                        break;
                    case 'reticular':
                        roofInclineMin = '10';
                        break;
                    case 'tieBeam':
                        roofInclineMin = '10';
                        break;
                }

                setMeasurements({...measurements, structureType: newMinValue, roofIncline: roofInclineMin!});
                break;
            case 1:
                let newMaxValue, roofInclineMax;
                if(measurements.structureType === '') {
                    newMaxValue = structures[0];
                } else if(structures.indexOf(measurements.structureType as string) === structures.length - 1) {
                    newMaxValue = structures[0];
                } else {
                    newMaxValue = structures[structures.indexOf(measurements.structureType as string) + 1]
                }

                switch(newMaxValue) {
                    case 'portal':
                        roofInclineMax = '25';
                        break;
                    case 'struts':
                        roofInclineMax = '25';
                        break;
                    case 'reticular':
                        roofInclineMax = '10';
                        break;
                    case 'tieBeam':
                        roofInclineMax = '10';
                        break;
                }

                setMeasurements({...measurements, structureType: newMaxValue, roofIncline: roofInclineMax!});
                break;
        }
    }
    function editDome(n: number) {
            const domeArr = ["D", "S", "DT", "SP"];
                switch(n) {
                    case 0:
                        let newMinValue;
                        if(measurements.dome === '') {
                            newMinValue = domeArr[domeArr.length - 1];
                        } else if(domeArr.indexOf(measurements.dome) === 0) {
                            newMinValue = domeArr[domeArr.length - 1];
                        } else {
                            newMinValue = domeArr[domeArr.indexOf(measurements.dome) - 1]
                        }
                        setMeasurements({...measurements, dome: newMinValue});
                        break;
                    case 1:
                        let newMaxValue;
                        if(measurements.dome === '') {
                            newMaxValue = domeArr[0];
                            console.log(domeArr[0])
                        } else if(domeArr.indexOf(measurements.dome) === domeArr.length - 1) {
                            newMaxValue = domeArr[0];
                        } else {
                            newMaxValue = domeArr[domeArr.indexOf(measurements.dome) + 1]
                        }
                        setMeasurements({...measurements, dome: newMaxValue});
                        break;
                }
    }
    function editInsulation(e: string) {
        setMeasurements({
            ...measurements,
            coveringType: e,
            coveringSubType: '',
            thicknessTop: '',
            thicknessBottom: ''
        })
    }
    function editSubInsulation(n:number) {
        const subInsulationArr = ["DL", "V"];

        switch(n) {
            case 0:
                let newMinValue;
                if(measurements.coveringSubType === '') {
                    newMinValue = subInsulationArr[subInsulationArr.length - 1];
                } else if(subInsulationArr.indexOf(measurements.coveringSubType) === 0) {
                    newMinValue = subInsulationArr[subInsulationArr.length - 1];
                } else {
                    newMinValue = subInsulationArr[subInsulationArr.indexOf(measurements.coveringSubType) - 1]
                }

                setMeasurements({...measurements, coveringSubType: newMinValue, thicknessTop: '', thicknessBottom: ''});
                break;
            case 1:
                let newMaxValue;
                if(measurements.coveringSubType === '') {
                    newMaxValue = subInsulationArr[0];
                } else if(subInsulationArr.indexOf(measurements.coveringSubType) === subInsulationArr.length - 1) {
                    newMaxValue = subInsulationArr[0];
                } else {
                    newMaxValue = subInsulationArr[subInsulationArr.indexOf(measurements.coveringSubType) + 1]
                }
                setMeasurements({...measurements, coveringSubType: newMaxValue, thicknessTop: '', thicknessBottom: ''});
                break;
        }
    }
    function setPitchesLabel(s:string) {
        let label = measurements.pitches;
        switch(s) {
            case "M":
                if(Number(measurements.pillars) > 3) {
                    label = "Singola";
                } else {
                    label = "Mono";
                }
                break;
            case "D":
            case "DH":
                label = "Doppia";
                break;
            case "S":
                label = "Shed";
                break;
            case "M1B":
                label = "Mono con becco singolo";
                break;
            case "M2B":
                label = "Mono con doppio becco";
                break;
        }

        return label;
    }
    function setStructureLabel(s:string) {
        let label = measurements.structureType;
        switch(s) {
            case "portal":
                label = "Portale";
                break;
            case "tieBeam":
                label = "Tirante";
                break;
            case "struts":
                label = "Puntoni";
                break;
            case "reticular":
                label = "Reticolare";
                break;
        }

        return label;
    }
    function setDomeLabel(s:string) {
        let label = measurements.dome;
        switch(s) {
            case "D":
                label = "Pannello a 2 falde";
                break;
            case "S":
                label = "Shed";
                break;
            case "DT":
                label = "Traslucido a 2 falde";
                break;
            case "SP":
                label = "Sferico";
                break;
        }

        return label;
    }
    // function setInsulationLabel(s:string) {
    //     let label = insulation;
    //     switch(s) {
    //         case "5G":
    //             label = "5 greche";
    //             break;
    //         case "FC":
    //             label = "Finto coppo";
    //             break;
    //         case "L":
    //             label = "Lamiera";
    //             break;
    //     }
    //
    //     return label;
    // }
    function setSubInsulationLabel(s:string) {
        let label = measurements.coveringSubType;
        switch(s) {
            case "DL":
                label = "Doppia lamiera";
                break;
            case "V":
                label = "Vetroresina";
                break;
        }

        return label;
    }
    function validateInput(e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) {
        // MANCANO:
        // - NO INIZIO CON PUNTO
        // - NO INIZIO CON 0 SE NON C'E' UNA VIRGOLA SUBITO DOPO
        let modInput;
        const roofIncline = measurements.roofIncline;

        modInput = e.target.value.replaceAll(/[^,.0-9]/g, '');
        modInput = modInput.replaceAll(/,/g, '.');
        if(modInput.includes('.') && modInput[modInput.length - 1] === '.') {
                if(modInput.match(/(\d+.\d+)/)) {
                    const arr = modInput.match(/(\d+.\d+)/);
                    modInput = arr![0];
                } else {
                    const arr = modInput.match(/(\d+.)/);
                    modInput = arr![0];
                }
            } else if(modInput.includes('.') && modInput[modInput.length - 1] !== '.') {
            const arr = modInput.match(/(\d+.\d+)/);
            modInput = arr![0];
        }

        if(e.target.name === 'roofIncline') {
            setMeasurements({...measurements, [e.target.name]: modInput});
        } else {
            setMeasurements({...measurements, [e.target.name]: modInput, roofIncline: roofIncline});
        }
    }

    const calc = useCallback((e?: React.SubmitEvent<HTMLFormElement>) => {
        e?.preventDefault();

        if(measurements.pillars === '10' && measurements.spansRight === '') {
            return;
        }

       if(measurements.pillars === '') {
           return;
       }

       if(measurements.pillars !== '10' && measurements.pitches === '') {
           return;
       }

       if(Number(measurements.pillars) > 2 && measurements.pillars !== '10' && measurements.structureType === '') {
           return;
       }

       if(measurements.pillars !== '10' && measurements.pillars !== '1'
           && !(measurements.pillars === '2' && measurements.pitches === 'M')
           && !(measurements.pillars === '3' && measurements.pitches === 'S')
           && measurements.dome === '') {
           return;
       }

       if(measurements.pillars !== '10' && (measurements.overhangRight === '' || measurements.overhangLeft === '')) {
           return;
       }

       if(measurements.coveringType === '5G' && measurements.coveringSubType === '') {
           return;
       }

        if(measurements.coveringSubType === 'DL' && (measurements.thicknessTop === '' || measurements.thicknessBottom === '')) {
            return;
        }

        if(measurements.coveringSubType === 'V' && measurements.thicknessTop === '') {
            return;
        }

        if(measurements.coveringType === 'L' && measurements.thicknessTop === '') {
            return;
        }

        setBaseMeasurements(measurements);
    }, [measurements, setBaseMeasurements]);

    useEffect(() => {
        if (!updateModelAfterSpanEdit.current) return;

        updateModelAfterSpanEdit.current = false;
        calc();
    }, [measurements, calc]);

    return (
        <>
        <section className="w-1/4 p-4 bg-asideground h-full">
            {/*SCELTA CUSTOM/PRESETS*/}
            <div className="w-full flex gap-4 items-center justify-center text-xs pt-4">
                <button type="button" value="0"
                        onClick={(e) => handleChangeGeometryTab(e, Number(e.currentTarget.value))}
                        className={`w-2/4 cursor-pointer p-4 ${geometryTab === 0 ? 'bg-tableground rounded-t-lg font-bold text-primary' : ''}`}
                >Custom
                </button>
                <button type="button" value="1"
                        onClick={(e) => handleChangeGeometryTab(e, Number(e.currentTarget.value))}
                        className={`w-2/4 cursor-pointer p-4 ${geometryTab === 1 ? 'bg-tableground rounded-t-lg font-bold text-primary' : ''}`}
                >Presets
                </button>
            </div>

            <div className={`${geometryTab === 0 ? 'block' : 'hidden'} bg-tableground rounded-tr-lg w-full gap-2 flex items-center justify-center text-xs py-4`}>
                <button type="button" value="0"
                        onClick={(e) => handleChange(e, Number(e.currentTarget.value))}
                        className={`flex gap-1 cursor-pointer rounded-lg py-3 px-2 ${customTab === 0 ? 'bg-titleground border border-2 border-strokes' : ''}`}
                >
                    <Image aria-hidden alt="icona delle strutture esterne" src="/structures.svg" width={16}
                           height={16}/>
                    Strutture
                </button>
                <button type="button" value="1"
                        onClick={(e) => handleChange(e, Number(e.currentTarget.value))}
                        className={`flex gap-1 cursor-pointer rounded-lg py-3 px-2 ${customTab === 1 ? 'bg-titleground border border-2 border-strokes' : ''}`}
                >
                    <Image aria-hidden alt="icona delle arredi interni" src="/inside.svg" width={16} height={16}/>
                    Interni
                </button>
            </div>

            {/*SCELTA ESTERNO/INTERNO*/}
            <div
                className={`bg-tableground ${geometryTab === 0 ? 'block' : 'hidden'} h-[calc(100%-216px)] overflow-y-auto`}>

                <div className={`${customTab === 0 ? 'block' : 'hidden'}`}>
                    <form id="measurements" className="flex flex-col gap-4" onSubmit={calc}>
                        <div className="px-4 pb-4">
                            <Accordion
                                sx={{
                                    '& .MuiAccordionDetails-root': {
                                        padding: "0 0 0 0"
                                    },
                                    '& .MuiAccordionSummary-root': {
                                        padding: "0"
                                    },
                                    boxShadow: "none",
                                    color: '#48484f'
                                }}>
                                <AccordionSummary
                                    expandIcon={<ExpandMore/>}
                                >
                                    <h2 className="uppercase font-semibold text-sm">Misure</h2>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <div className="flex flex-col gap-4 border-t border-t-primary">
                                        <div className="flex flex-col gap-2 mt-4">
                                            <p className="uppercase text-xsm font-semibold">Numero
                                                pilastri</p>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => editPillars(0)}
                                                        className="cursor-pointer border-2 border-strokes rounded-lg px-2 py-1 focus:border-primary focus:outline-none focus:ring-0">
                                                    <Image src="/minus.svg" alt="icona elemento precedente" width={12}
                                                           height={12} aria-hidden/>
                                                </button>
                                                <div
                                                    className="flex items-center py-1 px-2 w-full justify-center rounded-lg border-strokes border-2 font-jet text-xs font-semibold">
                                                    {measurements.pillars === ''
                                                        ? '-'
                                                        : measurements.pillars === '10'
                                                            ? 'Variabili'
                                                            : measurements.pillars
                                                    }
                                                </div>
                                                <button type="button" onClick={() => editPillars(1)}
                                                        className="cursor-pointer border-2 border-strokes rounded-lg px-2 py-1 focus:border-primary focus:outline-none focus:ring-0">
                                                    <Image src="/plus.svg" alt="icona elemento precedente" width={12}
                                                           height={12} aria-hidden/>
                                                </button>
                                            </div>
                                        </div>

                                        {measurements.pillars === '10' &&
                                            <>
                                                <div className="flex flex-col gap-2">
                                                    <p className="uppercase text-xsm font-semibold">Campate a
                                                        sinistra</p>
                                                    <div className="flex gap-2">
                                                        <button type="button" onClick={() => editSpans(0, 'right')}
                                                                className="cursor-pointer border-2 border-strokes rounded-lg px-2 py-1 focus:border-primary focus:outline-none focus:ring-0">
                                                            <Image src="/minus.svg" alt="icona elemento precedente"
                                                                   width={12}
                                                                   height={12} aria-hidden/>
                                                        </button>
                                                        <div
                                                            className="flex items-center py-1 px-2 w-full justify-center rounded-lg border-strokes border-2 font-jet text-xs font-semibold">

                                                            {measurements.spansRight === ''
                                                                ? '-'
                                                                : measurements.spansRight
                                                            }
                                                        </div>
                                                        <button type="button" onClick={() => editSpans(1, 'right')}
                                                                className="cursor-pointer border-2 border-strokes rounded-lg px-2 py-1 focus:border-primary focus:outline-none focus:ring-0">
                                                            <Image src="/plus.svg" alt="icona elemento precedente"
                                                                   width={12}
                                                                   height={12} aria-hidden/>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <p className="uppercase text-xsm font-semibold">Campate a destra</p>
                                                    <div className="flex gap-2">
                                                        <button type="button" onClick={() => editSpans(0, 'left')}
                                                                className="cursor-pointer border-2 border-strokes rounded-lg px-2 py-1 focus:border-primary focus:outline-none focus:ring-0">
                                                            <Image src="/minus.svg" alt="icona elemento precedente"
                                                                   width={12}
                                                                   height={12} aria-hidden/>
                                                        </button>
                                                        <div
                                                            className="flex items-center py-1 px-2 w-full justify-center rounded-lg border-strokes border-2 font-jet text-xs font-semibold">
                                                            {measurements.spansLeft === ''
                                                                ? '-'
                                                                : measurements.spansLeft
                                                            }
                                                        </div>
                                                        <button type="button" onClick={() => editSpans(1, 'left')}
                                                                className="cursor-pointer border-2 border-strokes rounded-lg px-2 py-1 focus:border-primary focus:outline-none focus:ring-0">
                                                            <Image src="/plus.svg" alt="icona elemento precedente"
                                                                   width={12}
                                                                   height={12} aria-hidden/>
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        }

                                        {measurements.pillars !== '' && measurements.pillars !== '10' &&
                                            <div className="flex flex-col gap-2">
                                                <p className="uppercase text-xsm font-semibold">Numero
                                                    {Number(measurements.pillars) > 3 ? ' altezze' : ' falde'}</p>
                                                <div className="flex gap-2">
                                                    <button type="button"
                                                            onClick={() => editPitches(0, Number(measurements.pillars))}
                                                            className="cursor-pointer border-2 border-strokes rounded-lg px-2 py-1 focus:border-primary focus:outline-none focus:ring-0">
                                                        <Image src="/prev.svg" alt="icona elemento precedente"
                                                               width={16} height={16} aria-hidden/>
                                                    </button>
                                                    <div
                                                        className="flex items-center py-1 px-2 w-full justify-center rounded-lg border-strokes border-2 font-jet text-xs font-semibold">
                                                        {measurements.pitches === '' ? '-' : setPitchesLabel(measurements.pitches as string)}
                                                    </div>
                                                    <button type="button"
                                                            onClick={() => editPitches(1, Number(measurements.pillars))}
                                                            className="cursor-pointer border-2 border-strokes rounded-lg px-2 py-1 focus:border-primary focus:outline-none focus:ring-0">
                                                        <Image src="/next.svg" alt="icona elemento successivo"
                                                               width={16} height={16} aria-hidden/>
                                                    </button>
                                                </div>
                                            </div>
                                        }

                                        {Number(measurements.pillars) > 3 && measurements.pitches === 'DH' &&

                                            <label className="flex flex-col uppercase text-xsm font-semibold">Seconda
                                                altezza
                                                <div
                                                    className="relative font-jet text-xs lowercase after:content-['m'] after:absolute after:top-[14px] after:left-[90%]"></div>
                                                <input
                                                    required
                                                    className="mt-2 p-1 pl-2 rounded-lg border-strokes border-2 font-jet text-xs focus:border-primary focus:outline-none focus:ring-0"
                                                    value={measurements.secondHeight}
                                                    name="secondHeight"
                                                    onChange={validateInput}
                                                />
                                            </label>
                                        }


                                        {Number(measurements.pillars) > 2 && measurements.pillars !== '10' &&
                                            <div className="flex flex-col gap-2">
                                                <p className="uppercase text-xsm font-semibold">Struttura</p>
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => editStructures(0)}
                                                            className="cursor-pointer border-2 border-strokes rounded-lg px-2 py-1 focus:border-primary focus:outline-none focus:ring-0">
                                                        <Image src="/prev.svg" alt="icona elemento precedente"
                                                               width={16} height={16} aria-hidden/>
                                                    </button>
                                                    <div
                                                        className="flex items-center py-1 px-2 w-full justify-center rounded-lg border-strokes border-2 font-jet text-xs font-semibold">
                                                        {measurements.structureType === '' ? '-' : setStructureLabel(measurements.structureType as string)}
                                                    </div>
                                                    <button type="button" onClick={() => editStructures(1)}
                                                            className="cursor-pointer border-2 border-strokes rounded-lg px-2 py-1 focus:border-primary focus:outline-none focus:ring-0">
                                                        <Image src="/next.svg" alt="icona elemento successivo"
                                                               width={16} height={16} aria-hidden/>
                                                    </button>
                                                </div>
                                            </div>

                                        }

                                        {measurements.pitches !== 'S' && measurements.pillars !== '10' &&
                                            <label className="flex flex-col uppercase text-xsm font-semibold">Pendenza
                                                tetto
                                                <div
                                                    className="relative font-jet text-xs after:content-['%'] after:absolute after:top-[14px] after:left-[90%]"></div>
                                                <input
                                                    required
                                                    className="mt-2 p-1 pl-2 font-jet text-xs rounded-lg border-strokes border-2 focus:border-primary focus:outline-none focus:ring-0"
                                                    value={measurements.roofIncline}
                                                    name="roofIncline"
                                                    onChange={validateInput}
                                                />
                                            </label>
                                        }

                                        <label className="flex flex-col uppercase text-xsm font-semibold">Altezza in
                                            gronda
                                            <div
                                                className="relative font-jet text-xs lowercase after:content-['m'] after:absolute after:top-[14px] after:left-[90%]"></div>
                                            <input
                                                required
                                                className="mt-2 p-1 pl-2 rounded-lg border-strokes border-2 font-jet text-xs focus:border-primary focus:outline-none focus:ring-0"
                                                value={measurements.eavesHeight}
                                                name="eavesHeight"
                                                onChange={validateInput}
                                            />
                                        </label>

                                        <label className="flex flex-col uppercase text-xsm font-semibold">Lunghezza
                                            <div
                                                className="relative font-jet text-xs lowercase after:content-['m'] after:absolute after:top-[14px] after:left-[90%]"></div>
                                            <input
                                                required
                                                className="mt-2 p-1 pl-2 rounded-lg border-strokes border-2 font-jet text-xs focus:border-primary focus:outline-none focus:ring-0"
                                                value={measurements.length}
                                                name="length"
                                                onChange={validateInput}
                                            />
                                        </label>

                                        <label className="flex flex-col uppercase text-xsm font-semibold">Larghezza
                                            <div
                                                className="relative font-jet text-xs lowercase after:content-['m'] after:absolute after:top-[14px] after:left-[90%]"></div>
                                            <input
                                                required
                                                className="mt-2 p-1 pl-2 rounded-lg border-strokes border-2 font-jet text-xs focus:border-primary focus:outline-none focus:ring-0"
                                                value={measurements.width}
                                                name="width"
                                                onChange={validateInput}
                                            />
                                        </label>

                                        <label className="flex flex-col uppercase text-xsm font-semibold">Interasse
                                            (lunghezza)
                                            <div
                                                className="relative font-jet text-xs lowercase after:content-['m'] after:absolute after:top-[14px] after:left-[90%]"></div>
                                            <input
                                                required
                                                className="mt-2 p-1 pl-2 rounded-lg border-strokes border-2 font-jet text-xs focus:border-primary focus:outline-none focus:ring-0"
                                                value={measurements.interaxleLength}
                                                name="interaxleLength"
                                                onChange={validateInput}
                                            />
                                        </label>

                                        {/* PROBLEMA: QUESTO NON SI PUÒ CAMBIARE SE NON NELLA MISURA TRA LE SINGOLE COPPIE, ALTRIMENTI LE MISURE NON TORNANO */}
                                        {/*<label className="flex flex-col uppercase text-xsm font-semibold">Interasse*/}
                                        {/*    (larghezza)*/}
                                        {/*    <div*/}
                                        {/*        className="relative font-jet text-xs lowercase after:content-['m'] after:absolute after:top-[14px] after:left-[90%]"></div>*/}
                                        {/*    <input*/}
                                        {/*        required*/}
                                        {/*        className="mt-2 p-1 pl-2 rounded-lg border-strokes border-2 font-jet text-xs focus:border-primary focus:outline-none focus:ring-0"*/}
                                        {/*        value=""*/}
                                        {/*        name="interaxleLength"*/}
                                        {/*        onChange={validateInput}*/}
                                        {/*    />*/}
                                        {/*</label>*/}

                                        {/*  SPORTO DESTRO  */}
                                        {measurements.pillars !== '10' &&
                                            <>
                                                <label className="flex flex-col uppercase text-xsm font-semibold">Sporto destro
                                                    <div
                                                        className="relative font-jet text-xs lowercase after:content-['m'] after:absolute after:top-[14px] after:left-[90%]"></div>
                                                    <input
                                                        required
                                                        className="mt-2 p-1 pl-2 rounded-lg border-strokes border-2 font-jet text-xs focus:border-primary focus:outline-none focus:ring-0"
                                                        value={measurements.overhangRight}
                                                        name="overhangRight"
                                                        onChange={validateInput}
                                                    />
                                                </label>

                                                {/*  SPORTO SINISTRO  */}
                                                <label className="flex flex-col uppercase text-xsm font-semibold">Sporto sinistro
                                                    <div
                                                    className="relative font-jet text-xs lowercase after:content-['m'] after:absolute after:top-[14px] after:left-[90%]"></div>
                                                    <input
                                                    required
                                                    className="mt-2 p-1 pl-2 rounded-lg border-strokes border-2 font-jet text-xs focus:border-primary focus:outline-none focus:ring-0"
                                                    value={measurements.overhangLeft}
                                                    name="overhangLeft"
                                                    onChange={validateInput}
                                                    />
                                                </label>
                                            </>
                                        }
                                    </div>
                                </AccordionDetails>
                            </Accordion>

                            <div aria-hidden className="bg-primary h-[2px] w-full"></div>

                            <div className="mt-4">
                                <Accordion
                                    sx={{
                                        '& .MuiAccordionDetails-root': {
                                            padding: "0 0 24px 0"
                                        },
                                        '& .MuiAccordionSummary-root': {
                                            padding: "0"
                                        },
                                        '& .MuiPaper-root-MuiAccordion-root:last-of-type': {
                                            borderRadius: "0"
                                        },
                                        boxShadow: "none",
                                        color: '#48484f'
                                    }}>
                                    <AccordionSummary
                                        expandIcon={<ExpandMore/>}
                                    >
                                        <h3 className="uppercase font-semibold text-sm">Cupolino</h3>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <div className="text-xs border-t border-t-primary pt-4">
                                            <div className="flex gap-4 mt-2">
                                                <div
                                                    className="flex gap-2 w-full">
                                                    <button type="button" onClick={() => editDome(0)}
                                                            className="cursor-pointer border-2 border-strokes rounded-lg px-2 py-1 focus:border-primary focus:outline-none focus:ring-0">
                                                        <Image src="/prev.svg" alt="icona elemento precedente"
                                                               width={16}
                                                               height={16} aria-hidden/>
                                                    </button>
                                                    <div
                                                        className="uppercase flex items-center py-1 px-2 w-full justify-center rounded-lg border-strokes border-2 font-jet text-xs font-semibold">
                                                        {measurements.dome === '' ? '-' : setDomeLabel(measurements.dome)}
                                                    </div>
                                                    <button type="button" onClick={() => editDome(1)}
                                                            className="cursor-pointer border-2 border-strokes rounded-lg px-2 py-1 focus:border-primary focus:outline-none focus:ring-0">
                                                        <Image src="/next.svg" alt="icona elemento successivo"
                                                               width={16}
                                                               height={16} aria-hidden/>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionDetails>
                                </Accordion>
                            </div>

                            <div aria-hidden className="bg-primary h-[2px] w-full"></div>

                            <div className="mt-4">
                                <Accordion
                                    sx={{
                                        '& .MuiAccordionDetails-root': {
                                            padding: "0 0 24px 0"
                                        },
                                        '& .MuiAccordionSummary-root': {
                                            padding: "0"
                                        },
                                        '& .MuiPaper-root-MuiAccordion-root:last-of-type': {
                                            borderRadius: "0"
                                        },
                                        boxShadow: "none",
                                        color: '#48484f'
                                    }}>
                                    <AccordionSummary
                                        expandIcon={<ExpandMore/>}
                                    >
                                        <h3 className="uppercase font-semibold text-sm">Arcarecci</h3>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <div className="text-xs border-t border-t-primary pt-4">
                                            <h4 className="flex flex-col uppercase text-xsm font-semibold">Tipologia:</h4>
                                            <div className="flex gap-4 mt-2">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                           required
                                                           onChange={(e) => setMeasurements({...measurements, purlin: e.target.value})}
                                                           value="normal"
                                                           className="accent-primary" type="radio" name="purlins-type"/>
                                                    Normali
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <input
                                                           required
                                                           onChange={(e) => setMeasurements({...measurements, purlin: e.target.value})}
                                                           value="light"
                                                           className="accent-primary" type="radio" name="purlins-type"/>
                                                    In luce
                                                </label>
                                            </div>
                                        </div>

                                        <div className="mt-4 text-xs">
                                            <h4 className="flex flex-col uppercase text-xsm font-semibold">Forma:</h4>
                                            <div className="flex gap-4 mt-2">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                           required
                                                           onChange={(e) => setMeasurements({...measurements, purlinShape: e.target.value})}
                                                           value="c"
                                                           className="accent-primary" type="radio"
                                                           name="purlins-shape"/>
                                                    C
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <input
                                                           required
                                                           onChange={(e) => setMeasurements({...measurements, purlinShape: e.target.value})}
                                                           value="omega"
                                                           className="accent-primary" type="radio"
                                                           name="purlins-shape"/>
                                                    Omega
                                                </label>
                                            </div>
                                        </div>
                                    </AccordionDetails>
                                </Accordion>
                            </div>

                            <div aria-hidden className="bg-primary h-[2px] w-full"></div>

                            <div className="mt-4">
                                <Accordion
                                    sx={{
                                        '& .MuiAccordionDetails-root': {
                                            padding: "0 0 24px 0"
                                        },
                                        '& .MuiAccordionSummary-root': {
                                            padding: "0"
                                        },
                                        boxShadow: "none",
                                        color: '#48484f'
                                    }}>
                                    <AccordionSummary
                                        expandIcon={<ExpandMore/>}
                                    >
                                        <h3 className="uppercase font-semibold text-sm">Copertura</h3>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <div className="flex flex-col gap-2 border-t border-t-primary pt-4">
                                            <p className="uppercase text-xsm font-semibold">Isolamento:</p>
                                            <FormControl variant="outlined" sx={{
                                                '& .MuiInputBase-root': {
                                                    fontFamily: "var(--font-barlow), sans-serif",
                                                    fontSize: "12px",
                                                    fontWeight: "500",
                                                    textTransform: "uppercase"
                                                },
                                                '& .MuiInputBase-input': {
                                                    padding: "8px !important"
                                                }
                                            }}>
                                                <Select
                                                    required
                                                    id="demo-simple-select"
                                                    value={measurements.coveringType}
                                                    onChange={(e) => editInsulation(e.target.value)}
                                                    MenuProps={{
                                                        slotProps: {
                                                            list: {
                                                                sx: {
                                                                    '& .MuiMenuItem-root': {
                                                                        fontFamily: "var(--font-barlow), sans-serif",
                                                                        fontSize: "12px",
                                                                        fontWeight: "500",
                                                                        textTransform: "uppercase",
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    }}
                                                >
                                                    <MenuItem value="5G">5 greche</MenuItem>
                                                    <MenuItem value="FC">Finto coppo</MenuItem>
                                                    <MenuItem value="L">Lamiera</MenuItem>
                                                </Select>
                                            </FormControl>

                                            <div className={`${measurements.coveringType === '5G' ? 'block' : 'hidden'} flex gap-2`}>
                                                <button type="button" onClick={() => editSubInsulation(0)}
                                                        className="cursor-pointer border-2 border-strokes rounded-lg px-2 py-1 focus:border-primary focus:outline-none focus:ring-0">
                                                    <Image src="/prev.svg" alt="icona elemento precedente" width={16}
                                                           height={16} aria-hidden/>
                                                </button>
                                                <div
                                                    className="uppercase flex items-center py-1 px-2 w-full justify-center rounded-lg border-strokes border-2 font-jet text-xs font-semibold">
                                                    {measurements.coveringSubType === '' ? '-' : setSubInsulationLabel(measurements.coveringSubType)}
                                                </div>
                                                <button type="button" onClick={() => editSubInsulation(1)}
                                                        className="cursor-pointer border-2 border-strokes rounded-lg px-2 py-1 focus:border-primary focus:outline-none focus:ring-0">
                                                    <Image src="/next.svg" alt="icona elemento successivo" width={16}
                                                           height={16} aria-hidden/>
                                                </button>
                                            </div>

                                            <div
                                                className={`${measurements.coveringType === '5G' && measurements.coveringSubType === 'DL' ? 'block' : 'hidden'}`}>
                                                <label
                                                    className="flex gap-4 items-center justify-between text-xs whitespace-nowrap">Lamiera
                                                    sup.
                                                    <input
                                                        value={measurements.thicknessTop}
                                                        name="thicknessTop"
                                                        onChange={(e) => validateInput(e)}
                                                        className="w-2/4 p-1 pl-2 rounded-lg border-strokes border-2 font-jet text-xs focus:border-primary focus:outline-none focus:ring-0"
                                                    />
                                                </label>
                                                <label
                                                    className="mt-1 flex gap-4 items-center justify-between text-xs whitespace-nowrap">Lamiera
                                                    inf.
                                                    <input
                                                        value={measurements.thicknessBottom}
                                                        name="thicknessBottom"
                                                        onChange={(e) => validateInput(e)}
                                                        className="w-2/4 p-1 pl-2 rounded-lg border-strokes border-2 font-jet text-xs focus:border-primary focus:outline-none focus:ring-0"
                                                    />
                                                </label>
                                            </div>
                                            <div
                                                className={`${measurements.coveringType === '5G' && measurements.coveringSubType === 'V' ? 'block' : 'hidden'}`}>
                                                <label
                                                    className="flex gap-4 items-center justify-between text-xs whitespace-nowrap">Lamiera
                                                    sup.
                                                    <input
                                                        value={measurements.thicknessTop}
                                                        name="thicknessTop"
                                                        onChange={(e) => validateInput(e)}
                                                        className="w-2/4 p-1 pl-2 rounded-lg border-strokes border-2 font-jet text-xs focus:border-primary focus:outline-none focus:ring-0"
                                                    />
                                                </label>
                                            </div>
                                            <div
                                                className={`${measurements.coveringType === 'L' ? 'block' : 'hidden'}`}>
                                                <label
                                                    className="flex gap-4 items-center justify-between text-xs whitespace-nowrap">Spessore
                                                    <input
                                                        value={measurements.thicknessTop}
                                                        name="thicknessTop"
                                                        onChange={(e) => validateInput(e)}
                                                        className="w-3/4 p-1 pl-2 rounded-lg border-strokes border-2 font-jet text-xs focus:border-primary focus:outline-none focus:ring-0"
                                                    />
                                                </label>
                                            </div>
                                        </div>


                                        <div className="mt-4 text-xs">
                                            <label className="flex flex-col uppercase text-xsm font-semibold">Spessore:
                                                <div
                                                    className="relative font-jet lowercase after:content-['mm'] after:absolute after:top-[14px] after:left-[86%]"></div>
                                                <input
                                                    required
                                                    className="mt-2 p-1 pl-2 rounded-lg border-strokes border-2 font-jet focus:border-primary focus:outline-none focus:ring-0"
                                                />
                                            </label>
                                        </div>
                                    </AccordionDetails>
                                </Accordion>
                            </div>

                            <div aria-hidden className="bg-primary h-[2px] w-full"></div>

                        </div>
                    </form>
                </div>
                <div className={`${customTab === 1 ? 'block' : 'hidden'}`}>
                    <div className="relative flex flex-col gap-4 h-[calc(100%-216px)] overflow-y-auto">
                        <div className="p-4">
                            <div>
                                <Accordion
                                    sx={{
                                        '& .MuiAccordionDetails-root': {
                                            padding: "0 0 24px 0"
                                        },
                                        '& .MuiAccordionSummary-root': {
                                            padding: "0"
                                        },
                                        boxShadow: "none",
                                        color: '#48484f'
                                    }}>
                                    <AccordionSummary
                                        expandIcon={<ExpandMore/>}
                                    >
                                        <h2 className="uppercase font-semibold text-sm">Interni</h2>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <div className="flex flex-col gap-4">
                                            <div className="mt-4 text-xs">
                                                <label className="flex flex-col uppercase font-semibold">Altro:
                                                    <div
                                                        className="relative font-jet lowercase after:content-['mm'] after:absolute after:top-[14px] after:left-[86%]"></div>
                                                    <input
                                                        className="mt-2 p-1 pl-2 rounded-lg border-strokes border-2 font-jet focus:border-primary focus:outline-none focus:ring-0"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </AccordionDetails>
                                </Accordion>
                            </div>
                            <div aria-hidden className="bg-primary h-[2px] w-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`${geometryTab === 0 ? 'block' : 'hidden'} rounded-b-lg bg-tableground pt-4 px-2 pb-2`}>
                <button type="submit" form="measurements"
                        className={`${geometryTab === 0 ? 'block' : 'hidden'} w-full bg-primary text-white rounded-2xlplus p-4 font-semibold text-sm cursor-pointer uppercase`}>
                    Aggiorna modello
                </button>
            </div>

            {/*SCELTA PRESETS*/}
            <div className={`${geometryTab === 1 ? 'block' : 'hidden'} h-[90%] overflow-y-auto`}>
                <div className="bg-tableground rounded-b-lg rounded-tl-lg">
                    <div className="p-4">
                        <div>
                            <Accordion
                                sx={{
                                    '& .MuiAccordionDetails-root': {
                                        padding: "0 0 24px 0"
                                    },
                                    '& .MuiAccordionSummary-root': {
                                        padding: "0"
                                    },
                                    boxShadow: "none",
                                    color: '#48484f'
                                }}>
                                <AccordionSummary
                                    expandIcon={<ExpandMore/>}
                                >
                                    <h2 className="uppercase font-semibold text-sm">Presets</h2>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <div className="flex flex-col gap-4">
                                        <div className="text-xs">
                                            <div className="flex flex-wrap gap-2">
                                                <button type="button"
                                                    className="cursor-pointer rounded-lg w-44 h-44 border-2 border-strokes border">
                                                    <Image className="object-cover w-[200px] h-[172px] rounded-lg" src="/screenshots/shed.webp" width={150} height={150} alt="preset preview"/>
                                                </button>
                                                <button type="button"
                                                    className="cursor-pointer rounded-lg w-44 h-44 border-2 border-strokes border">
                                                    <Image className="object-cover w-[200px] h-[172px] rounded-lg" src="/screenshots/4p.webp" width={150} height={150} alt="preset preview"/>
                                                </button>
                                                <button type="button"
                                                    className="cursor-pointer rounded-lg w-44 h-44 border-2 border-strokes border">
                                                    <Image className="object-cover w-[200px] h-[172px] rounded-lg" src="/screenshots/6p.webp" width={150} height={150} alt="preset preview"/>
                                                </button>
                                                <button type="button"
                                                    className="cursor-pointer rounded-lg w-44 h-44 border-2 border-strokes border">
                                                    <Image className="object-cover w-[200px] h-[172px] rounded-lg" src="/screenshots/8p.webp" width={150} height={150} alt="preset preview"/>
                                                </button>

                                            </div>
                                        </div>
                                    </div>
                                </AccordionDetails>
                            </Accordion>
                        </div>
                        <div aria-hidden className="bg-primary h-[2px] w-full"></div>
                    </div>
                </div>
            </div>
        </section>


            {pillars && pillars === 10 &&
                <div>
                    <button type="button" onClick={() => {
                        updateModelAfterSpanEdit.current = true;
                        editSpans(1, 'left');
                    }}
                            className="bg-white z-100 absolute top-[50%] right-[5dvw] cursor-pointer border-2 border-strokes rounded-lg px-2 py-1 focus:border-primary focus:outline-none focus:ring-0">
                        <Image src="/plus.svg" alt="icona elemento successivo"
                               width={12}
                               height={12} aria-hidden/>
                    </button>

                    <button type="button" onClick={() => {
                        updateModelAfterSpanEdit.current = true;
                        editSpans(1, 'right');
                    }}
                            className="bg-white z-100 absolute top-[50%] left-[25%] cursor-pointer border-2 border-strokes rounded-lg px-2 py-1 focus:border-primary focus:outline-none focus:ring-0">
                        <Image src="/plus.svg" alt="icona elemento successivo"
                               width={12}
                               height={12} aria-hidden/>
                    </button>
                </div>
            }
            {
                pillars && pillars === 10 &&
                <div className="z-100 absolute top-[10%] left-[50%] translate-x-[-25%] flex gap-2 justify-center items-center">
                    {new Array(spansRight).fill(0).map((el, i) => {
                        return (
                            <button
                                type="button"
                                key={`right-${i}`}
                                className="flex items-center justify-center bg-asideground h-12 w-12 cursor-pointer rounded-lg px-2 py-1 focus:border-primary focus:outline-none focus:ring-0"
                                onClick={() => {
                                    updateModelAfterSpanEdit.current = true;
                                    editSpans(0, 'right');
                                }}
                            >
                                S{i+1}
                            </button>
                        )
                    })}
                    {spansLeft && new Array(spansLeft).fill(0).map((el, i) => {
                        return (
                            <button
                                type="button"
                                key={`left-${i}`}
                                className="flex items-center justify-center bg-asideground h-12 w-12 cursor-pointer rounded-lg px-2 py-1 focus:border-primary focus:outline-none focus:ring-0"
                                onClick={() => {
                                    updateModelAfterSpanEdit.current = true;
                                    editSpans(0, 'left');
                                }}
                            >
                            D{i+1}
                            </button>
                        )
                    })}
                </div>

            }

        </>
    )
}
