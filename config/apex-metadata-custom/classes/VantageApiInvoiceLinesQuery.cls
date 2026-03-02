public class VantageApiInvoiceLinesQuery{
    
    private static List<String> monoTemps = new List<String>{'','','','','',''};
    private static List<String> colourTemps = new List<String>{'','','','','',''};

    private static Set<String> mono = new Set<String>{'Mono','Level 1'};
    private static Set<String> colour = new Set<String>{'Colour','Level 2'};
    private static Set<String> monoLarge = new Set<String>{'Mono large','Large Black'};
    private static Set<String> colourLarge = new Set<String>{'Colour large','large colour','Colour Large', 'Large Colour','Level 3'};
    private static Set<String> monoXLS = new Set<String>{'XLS Mono','Linear metre', 'Square metre'};
    private static Set<String> colourXLS = new Set<String>{'XLS Colour','XLS','Xtra long','Xtra Long'};
    private static Set<String> mpsCharge = new Set<String>{'Managed Print Service Charge ','MPS CHARGE','MPS Charge','MPS charge','MPS BBC','MPS COST','cMPS-CONTRACT CHARGE','MPS FLAT RATE (XF + SERVICE)','MPS FLAT RATE (XF)', 'MPS FLAT RATE (SERVICE)'};
    private static Set<String> basicCharge = new Set<String>{'BASIC CHARGE','BASIC CHARGE - SERVICE INCREASE','BASIC CONTRACT CHARGE','WFS BASIC CHARGE','WFS CONTRACT CHARGE','INTERNAL EQUIPMENT CHARGE','SOFTWARE SUPPORT CHARGE','CONTRACT CHARGE','CONTRACT CHARGE STUB PERIOD','FIERY SUPPORT CHARGE','DS BASIC CHARGE','XERETEC BILLED CONTRACT CHARGE','LANDSCAPE METER BILLED CONTRACT CHARGE','BASIC COST','Basic Charge','Basic Cost','Basic charge','Basic cost','BASIC CONTRACT CHARGE','BASIC CONTRACT COST','Basic Contract Charge','Basic Contract Cost'};
    private static Set<String> rentalCharge = new Set<String>{'XF B2B RENTAL CHARGE','SAFETY HARDWARE RENTAL','SOFTWARE RENTAL CHARGE','BOURNE LEISURE RENTAL CHARGE','HP B2B RENTAL CHARGE','RENTAL CHARGE','EQUITRAC B2B CHARGE','BASIC - MANAGEMENT FEES','DAAS-SERVICE','QUARTERLY RENTAL','Rental','B2B RENTAL CHARGE','MSP SERVICE RENTAL B2B','B2B RENTAL CHARGE','XF B2B RENTAL CHARGE', 'HP B2B RENTAL CHARGE', 'BBC B2B RENTAL CHARGE','Rental','RENTAL CHARGE','BNP LONDON RENTAL CHARGE','BOURNE LEISURE RENTAL CHARGE','EQUITRAC B2B CHARGE'};
    private static Set<String> otherCharge = new Set<String>{'RESITE CHARGE','UNCONNECTED DEVICE SURCHARGE ','CONVERSION CHARGE','DOCUHEAD CHARGE','FINISHER + HOLE PUNCH','FINISHER, HOLE PUNCH + FAX','SAFECOM ','LOAN REPAYMENT','WIDE FORMAT LEVEL PAY AGREEMENT HP CHARGE','Admin','FLAT RATE','QUARTERLY COPY CHARGE','Software Support Charge','XF Maintenance Charge','CAREPACK - FIELD SERVICE','CAREPACK CHARGE','CONTRACT CAREPACK CHARGE'};

    public class FlowInputs {
        @InvocableVariable
        public Integer vantageInvoiceId;
        
        @InvocableVariable
        public String token;

        @InvocableVariable
        public String sfInvoiceId;

        @InvocableVariable
        public String invoiceCurrency;
    }
    public class FlowOutput {
        @InvocableVariable
        public List<Vantage_Invoice_Line__c> accountInvoiceLines;
        
        public FlowOutput(List<Vantage_Invoice_Line__c> accountInvoiceLines) {
            this.accountInvoiceLines = accountInvoiceLines;
        }
    }
    @InvocableMethod
    public static FlowOutput[] psr(FlowInputs[] request) {
        FlowInputs inputs = request[0];
        String localToken = inputs.token;
        Integer localVOInvoiceId = inputs.vantageInvoiceId;
        String vantageInvoiceId = inputs.sfInvoiceId;
        String invoiceCurrency = inputs.invoiceCurrency;

        String activeQuery = '/invoiceline?$filter=InvoiceId%20eq%20' + localVOInvoiceId + 
        '%20and%20IsCost%20eq%20false&$select=OwnerSerialNumber,MeterTypeName,OwnerPartNumber,'+
        'OwnerDescription,OwnerLocation,Type,Details,IsPriceIncrease,CurrentReading,'+
        'PreviousReading,BaseUnitPrice,Quantity,BaseVatValue,BaseNetValue,BaseTotalValue,'+
        'PeriodStartDate,PeriodEndDate' +
        '&$expand=Contract($select=Id,Reference,PriceReviewMeterChange,StartMeterBillDate,PriceReviewMeterFrequency,NextPriceReviewMeterPeriod),'+
        'OwnerEquipment($select=InstallDate)';
        
        List<Object> tableResults = queryVOTable(activeQuery, localToken);
        
        List<Vantage_Invoice_Line__c> vantageInvoiceLines = formatResults(tableResults, localVOInvoiceId, invoiceCurrency);
        
        FlowOutput[] results = new FlowOutput[] { new FlowOutput(vantageInvoiceLines) };
        return results;
    }
    public static List<Object> queryVOTable(String query, String token) {
        try {
            HttpRequest request = new HttpRequest();
            request.setEndpoint('https://api.vantage.online/' + query);
            request.setMethod('GET');
            request.setHeader('Authorization', 'Bearer ' + token);
            request.setHeader('api-version', '1.19');
            request.setHeader('Accept', 'application/json');
            
            HttpResponse response = new Http().send(request);
            
            Map<String, Object> responseBody = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
            List<Object> valuesObject = (List<Object>) responseBody.get('value');
            return valuesObject;

        } catch (Exception ex) {
            return null;
        }
    }  
    private static Vantage_Invoice_Line__c createNewLineItem(String serialNumber, Integer localVOInvoiceId, Map<String, Object> lineFields, String invoiceCurrency) {
        Vantage_Invoice_Line__c lineItem = new Vantage_Invoice_Line__c();
        lineItem.Owner_Serial_Number__c = serialNumber;
        lineItem.Name = localVOInvoiceId + ' - ' + serialNumber;
        lineItem.Invoice_Id__c = localVOInvoiceId;
        lineItem.Meter_Start_Date__c = formatMeterDate(lineFields.get('PeriodStartDate'));
        lineItem.Meter_End_Date__c = formatMeterDate(lineFields.get('PeriodEndDate'));
        lineItem.CurrencyISOCode = invoiceCurrency;
        return lineItem;
    }
    private static String formatMeterDate(Object dateValue) {
        if(dateValue != null) {
            String formattedDate = (String) dateValue;
            return formattedDate.substring(0, 10);
        }
        return '';
    }
    private static List<Vantage_Invoice_Line__c> formatResults(List<Object> invoiceLines, Integer localVOInvoiceId, String invoiceCurrency) {
        Map<String, Vantage_Invoice_Line__c> lineMap = new Map<String, Vantage_Invoice_Line__c>();
                
        for (Object loopVOResults : invoiceLines) {
            Map<String, Object> lineFields = (Map<String, Object>) loopVOResults;
            String serialNumber = (String) lineFields.get('OwnerSerialNumber');
            String combinedFieldKey = serialNumber;
    
            Vantage_Invoice_Line__c lineItem;
            if (lineMap.containsKey(combinedFieldKey)) {
                lineItem = lineMap.get(combinedFieldKey);
            } else {
                lineItem = createNewLineItem(serialNumber, localVOInvoiceId, lineFields, invoiceCurrency);
                lineMap.put(combinedFieldKey, lineItem);
            }
            updateLineItemFields(lineItem, lineFields);
            accumulateFields(lineItem, lineFields);
        }
        return new List<Vantage_Invoice_Line__c>(lineMap.values());
    }
    private static void updateLineItemFields(Vantage_Invoice_Line__c lineItem, Map<String, Object> lineFields) {
        setBasicFields(lineItem, lineFields);
        setContractFields(lineItem, lineFields);
        setOwnerEquipmentFields(lineItem, lineFields);
    }
    private static void setBasicFields(Vantage_Invoice_Line__c lineItem, Map<String, Object> lineFields) {
        lineItem.Meter_Class_Name__c = (String) lineFields.get('MeterTypeName');
        lineItem.Owner_Part_Number__c = (String) lineFields.get('OwnerPartNumber');
        lineItem.Owner_Description__c = (String) lineFields.get('OwnerDescription');
        lineItem.Owner_Location__c = (String) lineFields.get('OwnerLocation');
        lineItem.Type__c = (String) lineFields.get('Type');
        lineItem.Details__c = (String) lineFields.get('Details');
        lineItem.Is_Price_Increase__c = (Boolean) lineFields.get('IsPriceIncrease');
    }
    private static void setContractFields(Vantage_Invoice_Line__c lineItem, Map<String, Object> lineFields) {
        if(lineFields.get('Contract') == null) {
            return;
        }
        
        Map<String, Object> contract = (Map<String, Object>) lineFields.get('Contract');
        
        if(contract.get('PriceReviewMeterChange') != null) {
            Decimal priceReviewChange = (Decimal) contract.get('PriceReviewMeterChange');
            lineItem.Price_Increase__c = priceReviewChange * 100;
        }
        
        if(contract.get('Id') != null) {
            lineItem.Contract_Id__c = String.valueOf(contract.get('Id'));
        }
    
        if(contract.get('Reference') != null) {
            lineItem.Contract_Reference__c = (String) contract.get('Reference');
        }
    
        if(contract.get('StartMeterBillDate') != null && contract.get('PriceReviewMeterFrequency') != null) {
            setPriceReviewDate(lineItem, contract);
        }
    }
    private static void setPriceReviewDate(Vantage_Invoice_Line__c lineItem, Map<String, Object> contract) {
        Integer periods = (contract.get('PriceReviewMeterFrequency') != null) ? (Integer) contract.get('PriceReviewMeterFrequency') : 0;
        String startDate = (contract.get('StartMeterBillDate') != null) ? (String) contract.get('StartMeterBillDate') : '';
        Integer monthsToAdd = (contract.get('NextPriceReviewMeterPeriod') != null) ? (Integer) contract.get('NextPriceReviewMeterPeriod') : 0;

        
        if(periods == 4) {
            monthsToAdd = monthsToAdd * 3;
        } else if(periods == 6) {
            monthsToAdd = monthsToAdd * 4;
        } else {
            monthsToAdd = monthsToAdd * 1;
        }
        
        priceReviewDate(lineItem, startDate, monthsToAdd);
    }
    private static void setOwnerEquipmentFields(Vantage_Invoice_Line__c lineItem, Map<String, Object> lineFields) {
        if(lineFields.get('OwnerEquipment') == null){   
            return;
        }
        
        Map<String, Object> asset = (Map<String, Object>) lineFields.get('OwnerEquipment');
        if(asset.get('InstallDate') != null) {
            lineItem.Install_Date__c = (String) asset.get('InstallDate');
        }
    }
    private static void priceReviewDate(Vantage_Invoice_Line__c lineItem, String inputDate, Integer numPeriods){
        Date thisDate = Date.valueOf(inputDate);
        Date newDate = thisDate.addMonths(numPeriods);
        lineItem.Period_Review_Date__c = newDate;
    }
    private static void accumulateFields(Vantage_Invoice_Line__c lineItem, Map<String, Object> lineFields) {
        accumulateBasicFields(lineItem, lineFields);

        String details = lineFields.get('Details').toString();
        
        if(details == 'Usage' || details == 'Consolidated Usage') {
            accumulateUsageFields(lineItem, lineFields);
        } else {
            accumulateChargeBasedOnDetail(lineItem, lineFields, details);
        }
    }
    private static void accumulateBasicFields(Vantage_Invoice_Line__c lineItem, Map<String, Object> lineFields) {
        accumulateField(lineItem, lineFields, 'BaseNetValue', 'Net_Charge__c');
        accumulateField(lineItem, lineFields, 'BaseVatValue', 'VAT_Charge__c');
        accumulateField(lineItem, lineFields, 'BaseTotalValue', 'Total_Charge__c');
    }
    private static void accumulateUsageFields(Vantage_Invoice_Line__c lineItem, Map<String, Object> lineFields) {
        String meterType = (lineFields.get('MeterTypeName') != null) ? lineFields.get('MeterTypeName').toString() : '';
        Decimal fieldValue = (Decimal) lineFields.get('BaseUnitPrice');
        if(colour.contains(meterType)) {
            accumulateColourFields(lineItem, lineFields, fieldValue);
        } else if(mono.contains(meterType)) {
            accumulateMonoFields(lineItem, lineFields, fieldValue);
        }else if(monoLarge.contains(meterType)) {
            accumulateMonoLargeFields(lineItem, lineFields, fieldValue);
        }else if(colourLarge.contains(meterType)) {
            accumulateColourLargeFields(lineItem, lineFields, fieldValue);
        }else if(monoXLS.contains(meterType)) {
            accumulateMonoXLSFields(lineItem, lineFields, fieldValue);
        }else if(colourXLS.contains(meterType)) {
            accumulateColourXLSFields(lineItem, lineFields, fieldValue);
        }
    }  
    private static void accumulateColourFields(Vantage_Invoice_Line__c lineItem, Map<String, Object> lineFields, Decimal fieldValue) {
        if(fieldValue == 0.000000){
            accumulateField(lineItem, lineFields, 'Quantity', 'Inclusive_Colour_Count__c');
        }
        if(lineItem.Owner_Serial_Number__c != colourTemps.get(0) || lineItem.Meter_Start_Date__c != colourTemps.get(1)){
            accumulateField(lineItem, lineFields, 'CurrentReading', 'Colour_Readings__c');
            accumulateField(lineItem, lineFields, 'PreviousReading', 'Colour_Previous__c');
            colourTemps.set(0,lineItem.Owner_Serial_Number__c);
            colourTemps.set(1,lineItem.Meter_Start_Date__c);
            
        }
        accumulateField(lineItem, lineFields, 'BaseUnitPrice', 'Colour_Charge__c');
    }
    private static void accumulateMonoFields(Vantage_Invoice_Line__c lineItem, Map<String, Object> lineFields, Decimal fieldValue) {
        if(fieldValue == 0.000000){
            accumulateField(lineItem, lineFields, 'Quantity', 'Inclusive_Mono_Count__c');
        }
        if(lineItem.Owner_Serial_Number__c != monoTemps.get(0) || lineItem.Meter_Start_Date__c != monoTemps.get(1)){
            accumulateField(lineItem, lineFields, 'CurrentReading', 'Mono_Readings__c');
            accumulateField(lineItem, lineFields, 'PreviousReading', 'Mono_Previous__c');
            monoTemps.set(0,lineItem.Owner_Serial_Number__c);
            monoTemps.set(1,lineItem.Meter_Start_Date__c);
        }
        accumulateField(lineItem, lineFields, 'BaseUnitPrice', 'Mono_Charge__c');
    }
    private static void accumulateColourLargeFields(Vantage_Invoice_Line__c lineItem, Map<String, Object> lineFields, Decimal fieldValue) {
        if(fieldValue == 0.000000){
            accumulateField(lineItem, lineFields, 'Quantity', 'Inclusive_Large_Colour_Count__c');
        }
        if(lineItem.Owner_Serial_Number__c != colourTemps.get(2) || lineItem.Meter_Start_Date__c != colourTemps.get(3)){
            accumulateField(lineItem, lineFields, 'CurrentReading', 'Large_Colour_Readings__c');
            accumulateField(lineItem, lineFields, 'PreviousReading', 'Large_Colour_Previous__c');
            colourTemps.set(2,lineItem.Owner_Serial_Number__c);
            colourTemps.set(3,lineItem.Meter_Start_Date__c);
        }
        accumulateField(lineItem, lineFields, 'BaseUnitPrice', 'Large_Colour_Charge__c');
    }
    private static void accumulateMonoLargeFields(Vantage_Invoice_Line__c lineItem, Map<String, Object> lineFields, Decimal fieldValue) {
        if(fieldValue == 0.000000){
            accumulateField(lineItem, lineFields, 'Quantity', 'Inclusive_Large_Mono_Count__c');
        }
        if(lineItem.Owner_Serial_Number__c != monoTemps.get(2) || lineItem.Meter_Start_Date__c != monoTemps.get(3)){
            accumulateField(lineItem, lineFields, 'CurrentReading', 'Large_Mono_Readings__c');
            accumulateField(lineItem, lineFields, 'PreviousReading', 'Large_Mono_Previous__c');
            monoTemps.set(2,lineItem.Owner_Serial_Number__c);
            monoTemps.set(3,lineItem.Meter_Start_Date__c);
        }
        accumulateField(lineItem, lineFields, 'BaseUnitPrice', 'Large_Mono_Charge__c');
    }
    private static void accumulateColourXLSFields(Vantage_Invoice_Line__c lineItem, Map<String, Object> lineFields, Decimal fieldValue) {
        if(fieldValue == 0.000000){
            accumulateField(lineItem, lineFields, 'Quantity', 'Inclusive_XLS_Colour_Count__c');
        }
        if(lineItem.Owner_Serial_Number__c != colourTemps.get(4) || lineItem.Meter_Start_Date__c != colourTemps.get(5)){
            accumulateField(lineItem, lineFields, 'CurrentReading', 'XLS_Colour_Readings__c');
            accumulateField(lineItem, lineFields, 'PreviousReading', 'XLS_Colour_Previous__c');
            colourTemps.set(4,lineItem.Owner_Serial_Number__c);
            colourTemps.set(5,lineItem.Meter_Start_Date__c);
        }
        accumulateField(lineItem, lineFields, 'BaseUnitPrice', 'XLS_Colour_Charge__c');
    }
    private static void accumulateMonoXLSFields(Vantage_Invoice_Line__c lineItem, Map<String, Object> lineFields, Decimal fieldValue) {
        if(fieldValue == 0.000000){
            accumulateField(lineItem, lineFields, 'Quantity', 'Inclusive_XLS_Mono_Count__c');
        }
        if(lineItem.Owner_Serial_Number__c != monoTemps.get(4) || lineItem.Meter_Start_Date__c != monoTemps.get(5)){
            accumulateField(lineItem, lineFields, 'CurrentReading', 'XLS_Mono_Readings__c');
            accumulateField(lineItem, lineFields, 'PreviousReading', 'XLS_Mono_Previous__c');
            monoTemps.set(4,lineItem.Owner_Serial_Number__c);
            monoTemps.set(5,lineItem.Meter_Start_Date__c);
        }
        accumulateField(lineItem, lineFields, 'BaseUnitPrice', 'XLS_Mono_Charge__c');
    }
    private static void accumulateChargeBasedOnDetail(Vantage_Invoice_Line__c lineItem, Map<String, Object> lineFields, String details) {
        String targetField;
        if(mpsCharge.contains(details)) {
            targetField = 'MPS_Charge__c';
        } else if(basicCharge.contains(details)) {
            targetField = 'Basic_Charge__c';
        } else if(rentalCharge.contains(details)) {
            targetField = 'Rental_Charge__c';
        } else{
            targetField = 'Other_Charges__c';
        }
        accumulateField(lineItem, lineFields, 'BaseUnitPrice', targetField);
    }
    private static void accumulateField(Vantage_Invoice_Line__c lineItem, Map<String, Object> lineFields, String fieldName, String targetField) {
        Decimal accumulatedValue = Decimal.valueOf(0);
        Decimal fieldValue = (Decimal) lineFields.get(fieldName);
        try{
            
            if (fieldValue == null) {
                return;
            }
            if (targetField == null) {
                accumulatedValue = Decimal.valueOf(0);
            }else{
                accumulatedValue = (Decimal) lineItem.get(targetField);
            }
            
            if (accumulatedValue == null) {
                accumulatedValue = Decimal.valueOf(0);
            }
            accumulatedValue += fieldValue;
            lineItem.put(targetField, accumulatedValue);
        }catch(Exception e){
            accumulatedValue += fieldValue;
            lineItem.put(targetField, accumulatedValue);
        }
    }
}