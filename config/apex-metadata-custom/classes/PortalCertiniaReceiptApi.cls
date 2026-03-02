@RestResource(urlMapping='/portal/certinia/receipt-po')
global with sharing class PortalCertiniaReceiptApi {
    global class ReceiptRequest {
        public String purchaseOrderId;
        public String purchaseOrderLineId;
        public String serialNumber;
        public Decimal quantity;
    }

    global class ReceiptResponse {
        public Boolean success;
        public String message;
        public List<String> errors;
    }

    @HttpPost
    global static ReceiptResponse receiptPo() {
        ReceiptResponse res = new ReceiptResponse();
        try {
            ReceiptRequest body = (ReceiptRequest) JSON.deserialize(
                RestContext.request.requestBody.toString(),
                ReceiptRequest.class
            );

            if (body == null || String.isBlank(body.purchaseOrderId) || String.isBlank(body.purchaseOrderLineId)) {
                RestContext.response.statusCode = 400;
                res.success = false;
                res.errors = new List<String>{ 'purchaseOrderId and purchaseOrderLineId are required' };
                return res;
            }

            Decimal qty = (body.quantity == null || body.quantity <= 0) ? 1 : body.quantity;

            scmc.InventoryAPI.POReceiptLine line = new scmc.InventoryAPI.POReceiptLine();
            line.poLineId = (Id) body.purchaseOrderLineId;
            line.qtyReceiving = qty;
            if (!String.isBlank(body.serialNumber)) {
                line.serialNumbers = new List<String>{ body.serialNumber };
            }

            scmc.InventoryAPI.getInstance().receivePO(
                (Id) body.purchaseOrderId,
                new List<scmc.InventoryAPI.POReceiptLine>{ line }
            );

            res.success = true;
            res.message = 'PO receipt completed';
            return res;
        } catch (Exception e) {
            RestContext.response.statusCode = 500;
            res.success = false;
            res.errors = new List<String>{ e.getMessage() };
            return res;
        }
    }
}