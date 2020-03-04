import { filter, find, maxBy } from "lodash";
import { config } from "./config/configuredValues";
const request = require("request");

const EstimatedChildBirths = require("./data/EstimatedChildBirths");
const Incomes = require("./data/Incomes");
const NationalRegistry = require("./data/National_registry");

type Period = {
  LeavePercentage: number;
  StartDate: String;
  EndDate: String;
};

type CalculationRequest = {
  SSN: String;
  WorkingType: String;
  PensionSavings: number;
  PersonalDiscount: number;
  Periods: [Period];
};

function findAll(obj: any, args: any, context: any) {
  return NationalRegistry.map(reg => {
    let SSN = reg.SSN;
    let info = {
      Income: find(Incomes, obj => obj.SSN === SSN),
      EstimatedChildBirth: find(
        EstimatedChildBirths,
        obj => obj.ParentSSN === SSN
      )
    };
    return {
      SSN: SSN,
      Name: reg.Name,
      Address: reg.Address,
      HasIncomes: !!info.Income,
      MonthIncome: !info.Income ? 0 : info.Income.MonthIncome,
      OtherMonthIncome: !info.Income ? 0 : info.Income.OtherMonthIncome,
      PensionSavings: !info.Income ? 0 : info.Income.PensionSavings,
      PersonalDiscount: !info.Income ? 0 : info.Income.PersonalTaxDiscount,
      ChildEstimateBirthDate: !info.EstimatedChildBirth
        ? null
        : info.EstimatedChildBirth.EstimatedBirthDate
    };
  });
}

// accumulate 4 different sources into one
const getIndividualsFullInfo = async () => {
  const individuals: any = await getIndividualsFromAPI();
  const incomes: any = await getIncomesFromAPI();
  const children: any = await getChildrenFromAPI();
  const estimatedChildBirth: any = await getEstimatedBirthDatesFromAPI();
  return individuals.map(reg => {
    let SSN = reg.Ssn;
    let info = {
      Children: find(children, item => item.ParentSSN === SSN),
      Income: find(incomes, obj => obj.Ssn === SSN),
      EstimatedChildBirth: find(
        estimatedChildBirth,
        obj => obj.ParentSsn === SSN
      )
    };
    return {
      SSN: SSN,
      Name: reg.Name,
      Address: reg.Address,
      HasChildren: !!info.Children,
      HasIncomes: !!info.Income,
      MonthIncome: !info.Income ? 0 : +info.Income.MonthIncome,
      OtherMonthIncome: !info.Income ? 0 : +info.Income.OtherMonthIncome,
      PensionSavings: !info.Income ? 0 : +info.Income.PensionSavings,
      PersonalDiscount: !info.Income ? 0 : +info.Income.PersonalTaxDiscount,
      ChildEstimateBirthDate: !info.EstimatedChildBirth
        ? null
        : info.EstimatedChildBirth.EstimatedBirthDate
    };
  });
};

const getChildrenFromAPI = async () => {
  return new Promise((resolve, reject) => {
    request(
      `http://localhost:4001/api/children`,
      { json: true },
      (error, response) => {
        if (error) throw new Error(error);
        resolve(response.body);
      }
    );
  });
};

const getIndividualsFromAPI = async () => {
  return new Promise((resolve, reject) => {
    request(
      `http://localhost:4001/api/individuals`,
      { json: true },
      (error, response) => {
        if (error) throw new Error(error);
        resolve(response.body);
      }
    );
  });
};

const getIncomesFromAPI = async () => {
  return new Promise((resolve, reject) => {
    request(
      `http://localhost:4002/api/incomes`,
      { json: true },
      (error, response) => {
        if (error) throw new Error(error);
        resolve(response.body);
      }
    );
  });
};

const getEstimatedBirthDatesFromAPI = async () => {
  return new Promise((resolve, reject) => {
    request(
      `http://localhost:4002/api/estimatedBirthDates`,
      { json: true },
      (error, response) => {
        if (error) throw new Error(error);
        resolve(response.body);
      }
    );
  });
};

export default {
  Query: {
    // simple proxy query for National registry API - children list (example file Þjóðskrá Börn.csv)
    proxyChildren: async () => await getChildrenFromAPI(),
    // simple proxy query for National registry - individuals list (example file Þjóðskrá Einstaklingar.csv)
    proxyIndividuals: async () => await getIndividualsFromAPI(),
    // simple proxy query for Directorate of labor API - maternity leave incomes (example file Vinnumálastofnun Fæðingaorlof tekjur.csv)
    proxyIncomes: async () => await getIncomesFromAPI(),
    // simple proxy query for Directorate of labor API - estimated birth date (example file Vinnumálastofnun Fæðingaorlof tekjur.csv)
    proxyEstimatedBirthDates: async () => await getEstimatedBirthDatesFromAPI(),
    // aggregate query for individuals
    individualsFullInfo: async () => await getIndividualsFullInfo(),
    // query for getting parent with the highest monthly income, who has children and has a scheduled birth date in May 2020
    findParentWithHighestIncome: async (
      obj: any,
      args: { birthMonth: string },
      context: any
    ) => {
      // getting aggregate information about individuals
      const result = await getIndividualsFullInfo();
      // filter with requested birth date pattern and hasChild condition
      let filteredByBirthPattern = filter(result, elem => {
        return (
          elem.ChildEstimateBirthDate.includes(args.birthMonth) &&
          elem.HasChildren
        );
      });
      // find maximum income (based on MonthIncome + OtherMonthIncome)
      return maxBy(filteredByBirthPattern, function(elem) {
        return elem.MonthIncome + elem.OtherMonthIncome;
      });
    },

    registries: () => NationalRegistry,
    infoBySSN: (obj: any, args: { SSN: String }, context: any) => {
      let info = {
        SSN: args.SSN,
        Registry: find(NationalRegistry, obj => obj.SSN === args.SSN),
        Income: find(Incomes, obj => obj.SSN === args.SSN),
        EstimatedChildBirth: find(
          EstimatedChildBirths,
          obj => obj.ParentSSN === args.SSN
        )
      };
      return {
        SSN: info.SSN,
        Name: !info.Registry ? "NO DATA" : info.Registry.Name,
        Address: !info.Registry ? "NO DATA" : info.Registry.Address,
        HasIncomes: !!info.Income,
        MonthIncome: !info.Income ? 0 : info.Income.MonthIncome,
        OtherMonthIncome: !info.Income ? 0 : info.Income.OtherMonthIncome,
        PensionSavings: !info.Income ? 0 : info.Income.PensionSavings,
        PersonalDiscount: !info.Income ? 0 : info.Income.PersonalTaxDiscount,
        ChildEstimateBirthDate: !info.EstimatedChildBirth
          ? null
          : info.EstimatedChildBirth.EstimatedBirthDate
      };
    },
    findRichestParent: (obj: any, args: any, context: any) => {
      let result = findAll(obj, args, context);

      return maxBy(
        filter(result, function(elem) {
          return elem.ChildEstimateBirthDate.includes("05.2020");
        }),
        function(elem) {
          return elem.MonthIncome + elem.OtherMonthIncome;
        }
      );
    },
    findAll: (obj: any, args: any, context: any) => {
      return findAll(obj, args, context);
    },
    calculateFinalAmount(
      obj: any,
      args: { calcRequest: CalculationRequest },
      context: any
    ) {
      console.log(JSON.stringify(args.calcRequest));
      let SSN: String = args.calcRequest.SSN;
      let workingType = args.calcRequest.WorkingType;
      let pensionSavingsPercentage = args.calcRequest.PensionSavings;
      let personalDiscount = args.calcRequest.PersonalDiscount;
      let periods = args.calcRequest.Periods;

      let minAmount = config.getMinimumAmountForWorkingType(workingType);
      if (
        workingType === config.WORKING_TYPE.EDUCATION ||
        workingType === config.WORKING_TYPE.OUT_OF_LABOR
      ) {
        let grossAmount = minAmount;
        let selectedRate = config.getPercentageForAmount(grossAmount);
        let tax = (selectedRate * grossAmount) / 100;
        let discount = (config.PERSONAL_TAX_CREDIT * personalDiscount) / 100;
        let netAmount = grossAmount - (tax - discount);

        let output = periods.map(
          p =>
            new Object({
              StartDate: p.StartDate,
              EndDate: p.EndDate,
              AmountNet: netAmount,
              AmountGross: grossAmount,
              Tax: new Object({
                Total: tax,
                RateSelected: selectedRate,
                Discount: discount
              })
            })
        );
        return {
          SSN,
          Periods: output
        };
      }

      //for workers
      let Income = find(Incomes, value => value.SSN === SSN);
      let averageSalary = Income.MonthIncome + Income.OtherMonthIncome;

      let output = periods.map(p => {
        let grossAmount =
          (Math.max(
            Math.min(averageSalary * 0.8, config.MAXIMUM_AMOUNT),
            minAmount
          ) *
            p.LeavePercentage) /
          100;
        let pensionFonds = (averageSalary * 0.8 * config.PENSION_FOND) / 100;
        let pensionSavings =
          (averageSalary * 0.8 * pensionSavingsPercentage) / 100;
        let selectedRate = config.getPercentageForAmount(grossAmount);
        let tax =
          (selectedRate * (grossAmount - pensionFonds - pensionSavings)) / 100;
        let discount = (config.PERSONAL_TAX_CREDIT * personalDiscount) / 100;
        let netAmount =
          grossAmount - pensionFonds - pensionSavings - (tax - discount);

        return new Object({
          StartDate: p.StartDate,
          EndDate: p.EndDate,
          AmountNet: netAmount,
          AmountGross: grossAmount,
          PensionFond: pensionFonds,
          PensionSavings: pensionSavings,
          Tax: new Object({
            Total: tax,
            RateSelected: selectedRate,
            Discount: discount
          })
        });
      });
      return {
        SSN,
        Periods: output
      };
    }
  }
};
