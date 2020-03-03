import { gql } from "apollo-server";

export default gql`
  type Income {
    SSN: String!
    PersonalTaxDiscount: Int
    MonthIncome: Int
    OtherMonthIncome: Int
    PensionSavings: Int
  }

  type EstimatedChildBirth {
    ParentSSN: String!
    EstimatedBirthDate: String!
  }

  type NationalRegistry {
    Name: String!
    SSN: String!
    Address: String
    Spouse: String
    SpouseSSN: String
  }

  type Individuals {
    Name: String!
    Ssn: String!
    Address: String
    Spouse: String
    SpouseSsn: String
  }

  type Children {
    Name: String!
    Ssn: String!
    ParentSsn: String
    BirthDate: String
  }

  type CombinedData {
    SSN: String!
    Name: String!
    Address: String
    HasIncomes: Boolean
    MonthIncome: Int
    OtherMonthIncome: Int
    PensionSavings: Int
    PersonalDiscount: Int
    ChildEstimateBirthDate: String
  }

  input Period {
    LeavePercentage: Int!
    StartDate: String!
    EndDate: String!
  }

  input CalculationRequest {
    SSN: String!
    WorkingType: String!
    PensionSavings: Int!
    PersonalDiscount: Int!
    Periods: [Period]
  }

  type Tax {
    Total: Float
    RateSelected: Float
    Discount: Float
  }

  type CalculatedPeriod {
    StartDate: String!
    EndDate: String!
    AmountNet: Float
    AmountGross: Float
    PensionFond: Float
    PensionSavings: Float
    Tax: Tax
  }

  type CalculationResponse {
    SSN: String!
    Periods: [CalculatedPeriod]
  }

  type Query {
    children: [Children],
    individuals: [Individuals],
    infoBySSN(SSN: String!): CombinedData
    findRichestParent: CombinedData
    findAll: [CombinedData]
    registries: [NationalRegistry]
    calculateFinalAmount(calcRequest: CalculationRequest): CalculationResponse
  }
`;
