type DomeElevationOffsetValues = {
    pillars: number | undefined;
    pitches: string | undefined;
    roofInclineRad: number | undefined;
    overhangLeft: number | undefined;
    overhangRight: number | undefined;
};

export function getDomeElevationOffset({
    pillars,
    pitches,
    roofInclineRad,
    overhangLeft,
    overhangRight
}: DomeElevationOffsetValues) {
    if (
        pillars === undefined
        || roofInclineRad === undefined
        || overhangLeft === undefined
        || overhangRight === undefined
    ) {
        return 0;
    }

    const isDoubleHeight = pillars > 3 && pitches === 'DH';
    if (isDoubleHeight) return 0;

    return Math.max(overhangLeft, overhangRight, 0)
        * Math.tan(roofInclineRad);
}
