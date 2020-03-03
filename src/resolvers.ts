import { filter, find, maxBy } from "lodash";
import { config } from "./config/configuredValues";
import { json } from "express";

const EstimatedChildBirths = require("./data/EstimatedChildBirths");
const Incomes = require("./data/Incomes");
const NationalRegistry = require("./data/National_registry");
const request = require("request");

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

const getChildrenFromAPI = async () => {
  console.log("getIndividualsFromAPI");
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
  console.log("getIndividualsFromAPI");
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

export default {
  Query: {
    children: async () => await getChildrenFromAPI(),
    individuals: async () => await getIndividualsFromAPI(),
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
