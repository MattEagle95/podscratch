const signal = require('./moneyPrinterSignal');

describe('kurs mindestens 5x gefallen, danach 2x um mindestens 1% gestiegen', () => {
    const needsTicksLow = 5;
    const needsTicksHigh = 2;
    const needsPercentage = 0.1;
    const needsMaxPercentage = 1;

    test('kurs 5x gefallen und danach 2x um mindestens 1% gestiegen, KAUFSIGNAL', () => {
        const mockPriceData = [
            100,
            95,
            90,
            87,
            85,
            80,
            90,
            91
        ];

        expect(signal(needsTicksLow, needsTicksHigh, needsPercentage, needsMaxPercentage, mockPriceData)).toBeTruthy();
    });

    test('kurs 6x gefallen, KAUFSIGNAL', () => {
        const mockPriceData = [
            100,
            95,
            90,
            87,
            85,
            80,
            70,
            90,
            91
        ];

        expect(signal(needsTicksLow, needsTicksHigh, needsPercentage, needsMaxPercentage, mockPriceData)).toBeTruthy();
    });

    test('kurs 4x gefallen, KEIN KAUFSIGNAL', () => {
        const mockPriceData = [
            100,
            95,
            90,
            87,
            85,
            100,
            120
        ];

        expect(signal(needsTicksLow, needsTicksHigh, needsPercentage, needsMaxPercentage, mockPriceData)).toBeFalsy();
    });

    test('kurs danach 3x gestiegen, KAUFSIGNAL', () => {
        const mockPriceData = [
            100,
            95,
            90,
            87,
            85,
            80,
            100,
            120,
            150
        ];

        expect(signal(needsTicksLow, needsTicksHigh, needsPercentage, needsMaxPercentage, mockPriceData)).toBeTruthy();
    });

    test('kurs danach 1x gestiegen, KEIN KAUFSIGNAL', () => {
        const mockPriceData = [
            100,
            95,
            90,
            87,
            85,
            100
        ];

        expect(signal(needsTicksLow, needsTicksHigh, needsPercentage, needsMaxPercentage, mockPriceData)).toBeFalsy();
    });

    test('kurs um weniger als 1% gestiegen, KEIN KAUFSIGNAL', () => {
        const mockPriceData = [
            100,
            95,
            90,
            87,
            85,
            86,
            87
        ];

        expect(signal(needsTicksLow, needsTicksHigh, needsPercentage, needsMaxPercentage, mockPriceData)).toBeFalsy();
    });
});