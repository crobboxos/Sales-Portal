@isTest
public class agxBankHolidayTest {
    @isTest
    static void testBankHoliday() {
		agxBankHoliday h = new agxBankHoliday();
        h.getProcessingDate();
        System.assertNotEquals(h.processDate, null,'Process Date is Null');
        System.assertNotEquals(h.expireDate, null,'Expire Date is Null');
        
        h.myStringValue = '{B]@i%s*w:?,-a$j#e)e(t! S^a.m}a]l[';
        h.removeSpecialChars();
        System.assertEquals('Biswajeet Samal',h.myFormatedValue,'Formated string does not match');
    } 
}