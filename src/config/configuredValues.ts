const FULL_TIME_MINIMUM_AMOUNT: number = 184119;
const PART_TIME_MINIMUM_AMOUNT: number = 132850;
const OUT_OF_LABOR_MINIMUM_AMOUNT: number = 80341;
const STUDYING_MINIMUM_AMOUNT: number = 184119;

const SMALL_INCOME: number = 336916;
const SMALL_PERCENTAGE : number = 35.04;
const HIGH_INCOME: number = 945873;
const HIGH_PERCENTAGE : number = 37.19;
const HIGHEST_PERCENTAGE : number = 46.24;

interface Config {
    MAXIMUM_AMOUNT : number,

    PENSION_FOND : number,
    PERSONAL_TAX_CREDIT : number,

    WORKING_TYPE : {
        FULL_TIME: String,
        PART_TIME: String,
        OUT_OF_LABOR: String,
        EDUCATION: String
    },

    getPercentageForAmount(amount : number) : number,
    getMinimumAmountForWorkingType(workingType: String) : number

}

export const config: Config = {
    WORKING_TYPE: {EDUCATION: "Education", FULL_TIME: "FullTime", OUT_OF_LABOR: "OutOfLabor", PART_TIME: "PartTime"},
    MAXIMUM_AMOUNT : 600000,

    PENSION_FOND : 4, //percent
    PERSONAL_TAX_CREDIT : 54628,

    getPercentageForAmount : function getPercentageForAmount(amount) {
        return amount <= SMALL_INCOME ? SMALL_PERCENTAGE : amount <= HIGH_INCOME ? HIGH_PERCENTAGE : HIGHEST_PERCENTAGE;
    },

    getMinimumAmountForWorkingType : function getMinimumAmountForWorkingPercentage(workingType) {
        return workingType === this.WORKING_TYPE.FULL_TIME ? FULL_TIME_MINIMUM_AMOUNT
            : workingType === this.WORKING_TYPE.PART_TIME ? PART_TIME_MINIMUM_AMOUNT
                : workingType === this.WORKING_TYPE.OUT_OF_LABOR ? OUT_OF_LABOR_MINIMUM_AMOUNT
                    : STUDYING_MINIMUM_AMOUNT
    }
};
