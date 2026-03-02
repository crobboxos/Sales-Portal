@isTest
private class VantageApiInvoiceLinesQueryTest {

    // Mock the HTTP callout
    private class MockHttpResponseGenerator implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"value": [' + 
                        '{"OwnerSerialNumber":"12345", "MeterTypeName":"Mono", "BaseUnitPrice":10, "BaseNetValue":100, "BaseVatValue":20, "BaseTotalValue":120, "Details":"Usage","OwnerPartNumber":"OPN-12345", "OwnerDescription":"Description12345"},'+
                        '{"OwnerSerialNumber":"12346", "MeterTypeName":"Colour", "BaseUnitPrice":15, "BaseNetValue":150, "BaseVatValue":30, "BaseTotalValue":180, "Details":"Usage","OwnerPartNumber":"OPN-12345", "OwnerDescription":"Description12345", "OwnerLocation":"Location A", "Type":"Type A", "IsPriceIncrease":true, "CurrentReading":1000, "PreviousReading":900, "Quantity":100,"PeriodStartDate":"2023-01-01", "PeriodEndDate":"2023-01-31", "Contract":{"Id":1, "Reference":"Ref-12345", "PriceReviewMeterChange":10, "StartMeterBillDate":"2023-01-01", "PriceReviewMeterFrequency":3, "NextPriceReviewMeterPeriod":1}, "OwnerEquipment":{"InstallDate":"2023-01-01"}},' +
                        '{"OwnerSerialNumber":"12347", "MeterTypeName":"Mono large", "BaseUnitPrice":20, "BaseNetValue":200, "BaseVatValue":40, "BaseTotalValue":240, "Details":"MPS CHARGE","OwnerPartNumber":"OPN-12345", "OwnerDescription":"Description12345", "OwnerLocation":"Location A", "Type":"Type A", "IsPriceIncrease":true, "CurrentReading":1000, "PreviousReading":900, "Quantity":100,"PeriodStartDate":"2023-01-01", "PeriodEndDate":"2023-01-31", "Contract":{"Id":1, "Reference":"Ref-12345", "PriceReviewMeterChange":10, "StartMeterBillDate":"2023-01-01", "PriceReviewMeterFrequency":3, "NextPriceReviewMeterPeriod":1}, "OwnerEquipment":{"InstallDate":"2023-01-01"}},' +
                        '{"OwnerSerialNumber":"12348", "MeterTypeName":"Colour large", "BaseUnitPrice":25, "BaseNetValue":250, "BaseVatValue":50, "BaseTotalValue":300, "Details":"BASIC CHARGE","OwnerPartNumber":"OPN-12345", "OwnerDescription":"Description12345", "OwnerLocation":"Location A", "Type":"Type A", "IsPriceIncrease":true, "CurrentReading":1000, "PreviousReading":900, "Quantity":100,"PeriodStartDate":"2023-01-01", "PeriodEndDate":"2023-01-31", "Contract":{"Id":1, "Reference":"Ref-12345", "PriceReviewMeterChange":10, "StartMeterBillDate":"2023-01-01", "PriceReviewMeterFrequency":3, "NextPriceReviewMeterPeriod":1}, "OwnerEquipment":{"InstallDate":"2023-01-01"}},' +
                        '{"OwnerSerialNumber":"12349", "MeterTypeName":"XLS Mono", "BaseUnitPrice":30, "BaseNetValue":300, "BaseVatValue":60, "BaseTotalValue":360, "Details":"RENTAL CHARGE","OwnerPartNumber":"OPN-12345", "OwnerDescription":"Description12345", "OwnerLocation":"Location A", "Type":"Type A", "IsPriceIncrease":true, "CurrentReading":1000, "PreviousReading":900, "Quantity":100,"PeriodStartDate":"2023-01-01", "PeriodEndDate":"2023-01-31", "Contract":{"Id":1, "Reference":"Ref-12345", "PriceReviewMeterChange":10, "StartMeterBillDate":"2023-01-01", "PriceReviewMeterFrequency":3, "NextPriceReviewMeterPeriod":1}, "OwnerEquipment":{"InstallDate":"2023-01-01"}},' +
                        '{"OwnerSerialNumber":"12350", "MeterTypeName":"XLS Colour", "BaseUnitPrice":35, "BaseNetValue":350, "BaseVatValue":70, "BaseTotalValue":420, "Details":"OTHER","OwnerPartNumber":"OPN-12345", "OwnerDescription":"Description12345", "OwnerLocation":"Location A", "Type":"Type A", "IsPriceIncrease":true, "CurrentReading":1000, "PreviousReading":900, "Quantity":100,"PeriodStartDate":"2023-01-01", "PeriodEndDate":"2023-01-31", "Contract":{"Id":1, "Reference":"Ref-12345", "PriceReviewMeterChange":10, "StartMeterBillDate":"2023-01-01", "PriceReviewMeterFrequency":3, "NextPriceReviewMeterPeriod":1}, "OwnerEquipment":{"InstallDate":"2023-01-01"}}' +
                        ']}');
            res.setStatusCode(200);
            return res;
        }
    }

    @isTest 
    static void testPsrMethod() {
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());
        
        VantageApiInvoiceLinesQuery.FlowInputs input = new VantageApiInvoiceLinesQuery.FlowInputs();
        input.vantageInvoiceId = 1;
        input.token = 'sampleToken';
        input.sfInvoiceId = '"sfId123"';

        Test.startTest();
        List<VantageApiInvoiceLinesQuery.FlowOutput> results = VantageApiInvoiceLinesQuery.psr(new List<VantageApiInvoiceLinesQuery.FlowInputs>{input});
        Test.stopTest();

        // Add assertions based on your expected results
        System.assertNotEquals(null, results);
        System.assertEquals(1, results.size());
        // You may add more detailed assertions based on your specific use case
    }

    @isTest 
    static void testQueryVOTableMethod() {
        // Test data setup
         String testQuery = '/invoiceline?$filter=InvoiceId%20eq%20123&$select=OwnerSerialNumber';
        String testToken = 'yourAccessToken';

        Test.startTest();
        List<Object> results = VantageApiInvoiceLinesQuery.queryVOTable(testQuery, testToken);
        Test.stopTest();

        // Add assertions based on your expected results
        //System.assertNotEquals(null, results);
        // You may add more detailed assertions based on your specific use case
    }

    // Add more test methods to cover other parts of your code
}