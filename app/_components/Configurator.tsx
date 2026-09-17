'use client'
import React, {useEffect} from 'react'
import * as THREE from "three";
import {Plane, useGLTF, useTexture} from "@react-three/drei";
import {useMeasurementsStore} from "@/app/_stores/measurements";
import {State} from "@/app/_types/State";
import {InstancedUniformsMesh} from 'three-instanced-uniforms-mesh';
import {extend} from '@react-three/fiber';
import Bases from "@/app/_components/_structure/Bases";
import Pillars from "@/app/_components/_structure/Pillars";
import BeamsRight from "@/app/_components/_structure/BeamsRight";
import BeamsLeft from "@/app/_components/_structure/BeamsLeft";
import PurlinsRight from "@/app/_components/_structure/PurlinsRight";
import PurlinsLeft from "@/app/_components/_structure/PurlinsLeft";
import CoveringRight from "@/app/_components/_structure/CoveringRight";
import CoveringLeft from "@/app/_components/_structure/CoveringLeft";
import DomePillarsRight from "@/app/_components/_structure/DomePillarsRight";
import DomePillarsLeft from "@/app/_components/_structure/DomePillarsLeft";
import DomeBeamsRight from "@/app/_components/_structure/DomeBeamsRight";
import DomeBeamsLeft from "@/app/_components/_structure/DomeBeamsLeft";
import DomePurlinsLeft from "@/app/_components/_structure/DomePurlinsLeft";
import DomePurlinsRight from "@/app/_components/_structure/DomePurlinsRight";
import DomePurlinsCentral from "@/app/_components/_structure/DomePurlinsCentral";
import DomeCoveringRight from "@/app/_components/_structure/DomeCoveringRight";
import DomeCoveringLeft from "@/app/_components/_structure/DomeCoveringLeft";
import DomeCoveringMono from "@/app/_components/_structure/DomeCoveringMono";
import DomeBeamMono from "@/app/_components/_structure/DomeBeamMono";
import DomePurlinsMono from "@/app/_components/_structure/DomePurlinsMono";
import CoveringRightDH from "@/app/_components/_structure/CoveringRightDH";
import CoveringLeftDH from "@/app/_components/_structure/CoveringLeftDH";
import PurlinsRightDH from "@/app/_components/_structure/PurlinsRightDH";
import PurlinsLeftDH from "@/app/_components/_structure/PurlinsLeftDH";
import BeamsLeftDH from "@/app/_components/_structure/BeamsLeftDH";
import BeamsRightDH from "@/app/_components/_structure/BeamsRightDH";
import Struts from "@/app/_components/_structure/Struts";
import Portal from "@/app/_components/_structure/Portal";
import StrutsSingle from "@/app/_components/_structure/StrutsSingle";
import PortalSingle from "@/app/_components/_structure/PortalSingle";
import StrutsSingleOpp from "@/app/_components/_structure/StrutsSingleOpp";
import PortalSingleOpp from "@/app/_components/_structure/PortalSingleOpp";
import TieBeam from "@/app/_components/_structure/TieBeam";
import TieBeamVert from "@/app/_components/_structure/TieBeamVert";
import TieBeamCentral from "@/app/_components/_structure/TieBeamCentral";
import Reticular from "@/app/_components/_structure/Reticular";
import ReticularSingle from "@/app/_components/_structure/ReticularSingle";
import ReticularSingleOpp from "@/app/_components/_structure/ReticularSingleOpp";
import DomeCoveringSpherical from "@/app/_components/_structure/DomeCoveringSpherical";
import BasesS from "@/app/_components/_structure/_sails/BasesS";
import PillarsS from "@/app/_components/_structure/_sails/PillarsS";
import BeamsS from "@/app/_components/_structure/_sails/BeamsS";
import CoveringS from "@/app/_components/_structure/_sails/CoveringS";
import PurlinsS from "@/app/_components/_structure/_sails/PurlinsS";
import PurlinsOmegaRight from "@/app/_components/_structure/PurlinsOmegaRight";
import PurlinsOmegaLeft from "@/app/_components/_structure/PurlinsOmegaLeft";
import PurlinsOmegaRightDH from "@/app/_components/_structure/PurlinsOmegaRightDH";
import PurlinsOmegaLeftDH from "@/app/_components/_structure/PurlinsOmegaLeftDH";
import DomePurlinsOmegaCentral from "@/app/_components/_structure/DomePurlinsOmegaCentral";
import DomePurlinsOmegaLeft from "@/app/_components/_structure/DomePurlinsOmegaLeft";
import DomePurlinsOmegaRight from "@/app/_components/_structure/DomePurlinsOmegaRight";
import DomePurlinsOmegaMono from "@/app/_components/_structure/DomePurlinsOmegaMono";
import {getDomeElevationOffset} from "@/app/_utils/getDomeElevationOffset";
extend({InstancedUniformsMesh});

export default function Configurator() {

    const pillars = useMeasurementsStore((state: State) => state.pillars);
    const pitches = useMeasurementsStore((state: State) => state.pitches);
    const structureType = useMeasurementsStore((state: State) => state.structureType);
    const width = useMeasurementsStore((state: State) => state.width);
    const length = useMeasurementsStore((state: State) => state.length);
    const domeType = useMeasurementsStore((state: State) => state.domeType);
    const secondHeight = useMeasurementsStore((state: State) => state.secondHeight);
    const purlinShape = useMeasurementsStore((state: State) => state.purlinShape);
    const roofInclineRad = useMeasurementsStore((state: State) => state.roofIncline.rad);
    const overhangLeft = useMeasurementsStore((state: State) => state.overhangLeft);
    const overhangRight = useMeasurementsStore((state: State) => state.overhangRight);

    const domeElevationOffset = getDomeElevationOffset({
        pillars,
        pitches,
        roofInclineRad,
        overhangLeft,
        overhangRight
    });

    const hasShortOuterOverhang = pillars !== 1 && (
        (overhangLeft !== undefined && overhangLeft < 1.5)
        || (overhangRight !== undefined && overhangRight < 1.5)
    );

    const setGeometry = useMeasurementsStore((state: State) => state.setGeometry);

    const localPlaneLeft = new THREE.Plane( new THREE.Vector3( -1, 0, 0 ), 0);
    const localPlaneRight = new THREE.Plane( new THREE.Vector3( 1, 0, 0 ), 0);

    const baseModel = useGLTF('/pilastro.glb');

    const structureModels = {
        domeCoveringSpherical: (baseModel.scene.children[26] as THREE.Mesh).geometry,
        domeCoveringRight: (baseModel.scene.children[10] as THREE.Mesh).geometry,
        domeCoveringLeft: (baseModel.scene.children[9] as THREE.Mesh).geometry,
        domeCoveringFCRight: (baseModel.scene.children[27] as THREE.Mesh).geometry,
        domeCoveringFCLeft: (baseModel.scene.children[28] as THREE.Mesh).geometry,
        domeCoveringLamRight: (baseModel.scene.children[23] as THREE.Mesh).geometry,
        domeCoveringLamLeft: (baseModel.scene.children[25] as THREE.Mesh).geometry,
        domePurlinsRight: (baseModel.scene.children[11] as THREE.Mesh).geometry,
        domePurlinsOmegaCentral: (baseModel.scene.children[14] as THREE.Mesh).geometry,
        domePurlinsCentral: (baseModel.scene.children[12] as THREE.Mesh).geometry,
        domePurlinsOmega: (baseModel.scene.children[14] as THREE.Mesh).geometry,
        domePurlinsLeft: (baseModel.scene.children[12] as THREE.Mesh).geometry,
        domeBeamsRight: (baseModel.scene.children[8] as THREE.Mesh).geometry,
        domeBeamsLeft: (baseModel.scene.children[8] as THREE.Mesh).geometry,
        domePillarsRight: (baseModel.scene.children[7] as THREE.Mesh).geometry,
        domePillarsLeft: (baseModel.scene.children[13] as THREE.Mesh).geometry,
        coveringLamRight: (baseModel.scene.children[22] as THREE.Mesh).geometry,
        coveringLamLeft: (baseModel.scene.children[24] as THREE.Mesh).geometry,
        coveringFCRight: (baseModel.scene.children[29] as THREE.Mesh).geometry,
        coveringFCLeft: (baseModel.scene.children[30] as THREE.Mesh).geometry,
        coveringRight: (baseModel.scene.children[3] as THREE.Mesh).geometry,
        coveringLeft: (baseModel.scene.children[4] as THREE.Mesh).geometry,
        purlinsOmega: (baseModel.scene.children[15] as THREE.Mesh).geometry,
        purlinsRight: (baseModel.scene.children[5] as THREE.Mesh).geometry,
        purlinsLeft: (baseModel.scene.children[6] as THREE.Mesh).geometry,
        beamsRight: (baseModel.scene.children[1] as THREE.Mesh).geometry,
        beamsLeft: (baseModel.scene.children[1] as THREE.Mesh).geometry,
        capitalPortalSOpp: (baseModel.scene.children[17] as THREE.Mesh).geometry,
        capitalPortalS: (baseModel.scene.children[18] as THREE.Mesh).geometry,
        capitalPortalD: (baseModel.scene.children[16] as THREE.Mesh).geometry,
        capitalStrutsSOpp: (baseModel.scene.children[20] as THREE.Mesh).geometry,
        capitalStrutsS: (baseModel.scene.children[21] as THREE.Mesh).geometry,
        capitalStrutsD: (baseModel.scene.children[19] as THREE.Mesh).geometry,
        pillars: (baseModel.scene.children[0] as THREE.Mesh).geometry,
        bases: (baseModel.scene.children[2] as THREE.Mesh).geometry,
    }

    useEffect(() => {
        setGeometry(structureModels);
    }, [])

    const grayMatcap = useTexture('/gray-matcap.webp');
    const redMatcap = useTexture('/red-matcap.webp');
    const matcapMaterial = new THREE.MeshMatcapMaterial({matcap: grayMatcap});
    const matcapMaterialClippedLeft = new THREE.MeshMatcapMaterial({matcap: grayMatcap, clippingPlanes: [localPlaneLeft]});
    const matcapMaterialClippedRight = new THREE.MeshMatcapMaterial({matcap: grayMatcap, clippingPlanes: [localPlaneRight]});
    const redMatcapMaterial = new THREE.MeshMatcapMaterial({matcap: redMatcap});
    const redMatcapMaterialClippedLeft = new THREE.MeshMatcapMaterial({matcap: redMatcap, clippingPlanes: [localPlaneLeft]});
    const redMatcapMaterialClippedRight = new THREE.MeshMatcapMaterial({matcap: redMatcap, clippingPlanes: [localPlaneRight]});
    const redMatcapMaterialClippedLeftTransp = new THREE.MeshMatcapMaterial({matcap: redMatcap, clippingPlanes: [localPlaneLeft], transparent: true, opacity: 0.75});
    const redMatcapMaterialClippedRightTransp = new THREE.MeshMatcapMaterial({matcap: redMatcap, clippingPlanes: [localPlaneRight], transparent: true, opacity: 0.75});

    return (
        <>
            <Plane args={[width ? width + 10 : 0, length ? length + 10 : 0]} rotation={[-Math.PI / 2, 0, 0]}
                   position={[0, 0, length ? -length / 2 : 0]}/>

            {pillars && pillars !== 10 &&
                <>
                    <group position={[0, domeElevationOffset, 0]}>
                        {domeType === 'S'
                            ? <>
                                <DomeCoveringMono material={redMatcapMaterial}/>
                                {purlinShape === 'c'
                                    ? <DomePurlinsMono material={matcapMaterial}/>
                                    : <DomePurlinsOmegaMono material={matcapMaterial}/>
                                }
                                <DomeBeamMono material={matcapMaterial}/>
                            </>
                            : <>
                                {domeType === 'SP'
                                    ? <DomeCoveringSpherical material={redMatcapMaterial}/>
                                    : <>
                                        <DomeCoveringLeft material={domeType === 'DT' ? redMatcapMaterialClippedLeftTransp : redMatcapMaterialClippedLeft}/>
                                        <DomeCoveringRight material={domeType === 'DT' ? redMatcapMaterialClippedRightTransp : redMatcapMaterialClippedRight}/>
                                      </>
                                }
                                {purlinShape === 'c'
                                    ? <>
                                        <DomePurlinsCentral material={matcapMaterial}/>
                                        <DomePurlinsLeft material={matcapMaterial}/>
                                        <DomePurlinsRight material={matcapMaterial}/>
                                      </>
                                    : <>
                                        <DomePurlinsOmegaCentral material={matcapMaterial}/>
                                        <DomePurlinsOmegaLeft material={matcapMaterial}/>
                                        <DomePurlinsOmegaRight material={matcapMaterial}/>
                                      </>
                                }
                                <DomeBeamsLeft material={matcapMaterialClippedLeft}/>
                                <DomeBeamsRight material={matcapMaterialClippedRight}/>
                              </>
                        }

                        <DomePillarsRight material={matcapMaterial}/>
                        <DomePillarsLeft material={matcapMaterial}/>
                    </group>

                    {
                        pitches === 'DH' && secondHeight &&
                        <>
                            <CoveringRightDH material={redMatcapMaterial}/>
                            <CoveringLeftDH material={redMatcapMaterial}/>
                            { purlinShape === 'c'
                                ? <>
                                    <PurlinsRightDH material={matcapMaterial}/>
                                    <PurlinsLeftDH material={matcapMaterial}/>
                                </>
                                : <>
                                    <PurlinsOmegaRightDH material={matcapMaterial}/>
                                    <PurlinsOmegaLeftDH material={matcapMaterial}/>
                                </>
                            }
                            <BeamsLeftDH material={matcapMaterialClippedLeft}/>
                            <BeamsRightDH material={matcapMaterialClippedRight}/>
                        </>
                    }

                    <CoveringRight
                        material={pillars === 1 && pitches === 'D' ? redMatcapMaterialClippedRight : redMatcapMaterial}/>
                    <CoveringLeft
                        material={pitches?.includes('S') || (pillars === 1 && pitches === 'D') ? redMatcapMaterialClippedLeft : redMatcapMaterial}/>
                    { purlinShape === 'c'
                        ? <>
                            <PurlinsRight material={matcapMaterial}/>
                            <PurlinsLeft material={matcapMaterial}/>
                          </>
                        : <>
                            <PurlinsOmegaRight material={matcapMaterial}/>
                            <PurlinsOmegaLeft material={matcapMaterial}/>
                          </>
                    }
                    <BeamsLeft
                        material={(pillars < 3 && pitches?.includes('M')) ? matcapMaterial : matcapMaterialClippedLeft}/>
                    <BeamsRight material={matcapMaterialClippedRight}/>

                    {
                        structureType === 'portal'
                            ? <Portal material={matcapMaterial}/>
                            : structureType === 'struts'
                                ? <Struts material={matcapMaterial}/>
                                : structureType === 'tieBeam'
                                    ? <>
                                        <TieBeamVert material={matcapMaterial}/>
                                        <TieBeam material={matcapMaterial}/>
                                    </>
                                    : structureType === 'reticular' && !(pitches === 'S' && pillars === 3)
                                        ? <>
                                            <Reticular/>
                                        </>
                                    : <></>
                    }

                    {
                        structureType === 'portal' && (secondHeight || (pitches === 'S' && pillars === 3) || hasShortOuterOverhang)
                            ? <>
                                <PortalSingle material={matcapMaterial}/>
                                <PortalSingleOpp material={matcapMaterial}/>
                            </>
                            : structureType === 'struts' && (secondHeight || (pitches === 'S' && pillars === 3) || hasShortOuterOverhang)
                                ?
                                <>
                                    <StrutsSingle material={matcapMaterial}/>
                                    <StrutsSingleOpp material={matcapMaterial}/>
                                </>
                                : structureType === 'reticular' && (secondHeight || (pitches === 'S' && pillars === 3))
                                    ?
                                    <>
                                        <ReticularSingle/>
                                        <ReticularSingleOpp />
                                    </>
                                    : structureType === 'tieBeam' && secondHeight
                                        ?
                                        <>
                                            <TieBeamCentral material={matcapMaterial}/>
                                        </>
                                    : <></>
                    }

                    <Pillars material={matcapMaterial}/>
                    <Bases material={matcapMaterial}/>
                </>
            }
            {pillars && pillars === 10 &&
                <>
                    <CoveringS material={redMatcapMaterial}/>
                    <PurlinsS material={matcapMaterial}/>
                    <BeamsS material={matcapMaterial} />
                    <PillarsS material={matcapMaterial} />
                    <BasesS material={matcapMaterial} />
                </>
            }
        </>
    );

}
