public with sharing class BusinessHoursCalculator {

    public class FlowInputs {       
        @InvocableVariable
        public String businessHoursId;
        @InvocableVariable
        public Datetime createdDate, completedDate;
    }
    
    public class FlowOutput {
        @InvocableVariable
        public Decimal totalHours;
        public FlowOutput(Decimal totalHours) {
            this.totalHours = totalHours;
        }
    }

    @InvocableMethod
    public static FlowOutput[] BusinessHoursCalculator(FlowInputs[] inputs){
        List<FlowOutput> flowOutputs = new List<FlowOutput>();
        Decimal result = BusinessHours.diff(inputs.get(0).businessHoursId,inputs.get(0).createdDate,inputs.get(0).completedDate);
        Decimal resultingHours = result/(60*1000);
        flowOutputs.add(new FlowOutput(resultingHours.setScale(2)));
        return flowOutputs.isEmpty() ? null : flowOutputs;
    }
}