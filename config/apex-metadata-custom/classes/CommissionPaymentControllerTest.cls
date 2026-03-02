@isTest
public class CommissionPaymentControllerTest {
    
    @isTest static void testGetCommissionPayments() {
            Test.startTest();
            List<Commission_Payment__c> commissionPayments = CommissionPaymentController.getCommissionPayments('0068e00000GQWHMAA5', '0054K000003pxO9QAI');
            Test.stopTest();
    }
}