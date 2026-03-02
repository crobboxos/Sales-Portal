@isTest
private class BusinessHoursCalculatorTest {

    @isTest
    static void testBusinessHoursCalculator() {
        // Create test data
        BusinessHoursCalculator.FlowInputs flowInputs = new BusinessHoursCalculator.FlowInputs();
        flowInputs.businessHoursId = '01m4K000000otH0QAI'; // replace with a valid Business Hours Id
        flowInputs.createdDate = Datetime.newInstance(2024, 1, 31, 9, 0, 0); // replace with valid dates
        flowInputs.completedDate = Datetime.newInstance(2024, 1, 31, 17, 0, 0);

        // Invoke the BusinessHoursCalculator method
        BusinessHoursCalculator.FlowOutput[] flowOutputs = BusinessHoursCalculator.BusinessHoursCalculator(new List<BusinessHoursCalculator.FlowInputs>{flowInputs});

        // Additional assertions can be added as needed
    }
}