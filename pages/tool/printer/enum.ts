export enum DocType {
    打印机使用说明,
    文稿格式,
}

export enum StoreType {
    电脑,
    U盘,
}

export enum SerialNumberType {
    美能达1100,
    美能达C4070,
    立思辰9540,
}

export enum FeatureType {
    扫描,
    复印,
}

export enum PageOptionType {
    单页,
    双页,
    A4转A3,
    A3转A4,
    合页装订,
    两点装订,
    角装订,
}

export const featureList = []
export const serialNumberList = []
export const storeList = []
export const pageOptionList = []

const tempArr = [
    {
        list: storeList,
        enumName: StoreType,
    },
    { list: serialNumberList, enumName: SerialNumberType },
    { list: featureList, enumName: FeatureType },
    { list: pageOptionList, enumName: PageOptionType },
]
tempArr.forEach(({ list, enumName }) => {
    for (const key in enumName) {
        if (typeof enumName[key] === 'number') {
            list.push({
                value: enumName[key],
                text: key,
            })
        }
    }
})
