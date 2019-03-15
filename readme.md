

| Key               | Default       |
| ----------------- | ------------- |
| STORE_HOST        | localhost     |
| STORE_PORT        | 27017         |
| QUEUE_PROTOCOL    | amqp          |
| QUEUE_HOST        | localhost     |
| QUEUE_PORT        | 5672          |
| QUEUE_USER        | guest         |
| QUEUE_PASSWORD    | guest         |
| API_HOST          | localhost     |



```

add issue
    php:issue.add
        |
        +- issue.add:[issue.add] -> `issue.addIssue`
        |           * (create new item in Issue collection)
        |
        `- []
        
add document
    php:document.add
        |
        +- document.add:[document.add] -> `document.addDocument`
        |           * create new item in document collection
        |
        +- document.add:[issue.add.progress] -> `issue.addProgressToIssue`
        |           * set progress to Issue
        |
        `- document.add:[document.add.issue] -> `document.addDocumentToIssue`
                    * set date, isGovernmentIssue, documents.documentCategories, documents.documentCount to Issue

add congressman to document
    php:congressman-document.add
        |
        +- congressman-document.add:[congressman-document.add] -> `document-congressman.addProponentDocument` 
        |           * Add proponent(s) to Document
        |
        +- congressman-document.add:[congressman-document.add.proponent] -> `document-congressman.addProponentIssue`
        |           * Add proponent to Issue (if primary document)
        |
        `- congressman-document.add:[issue.add.proponents-count] -> `document-congressman.addProponentCountIssue`
                    * Add proponents count to Issue

```
