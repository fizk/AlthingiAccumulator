

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

add assembly
    php:assembly.add
        |
        +- assembly.*:[assembly.add] -> `Assembly.add`
        |           - create new item in assembly collection
        |
        `- []

add issue
    php:issue.add
        |
        +- issue.*:[issue.add] -> `issue.addIssue`
        |           - create new item in Issue collection
        |
        +- issue.*:[issue.category.add] -> `issue.addCategory`
        |           - set categories to issue
        |
        `- issue.*:[issue.assembly.add] -> `issue.addIssueToAssembly`
        
add issue-category
    php:issue-category.add
        |
        `- issue-category.*:[issue.category.add] -> `issue.addCategory`
                    - set categories to issue

        
add document
    php:document.add
        |
        +- document.*:[document.add] -> `document.addDocument`
        |           - create new item in document collection
        |
        +- document.*:[issue.add.progress] -> `issue.addProgressToIssue`
        |           - set progress to Issue
        |
        `- document.*:[document.add.issue] -> `document.addDocumentToIssue`
                    - set date, isGovernmentIssue, documents.documentCategories, documents.documentCount to Issue

add congressman to document
    php:congressman-document.add
        |
        +- congressman-document.*:[congressman-document.add] -> `document-congressman.addProponentDocument` 
        |           - Add proponent(s) to Document
        |
        +- congressman-document.*:[congressman-document.add.proponent] -> `document-congressman.addProponentIssue`
        |           - Add proponent to Issue (if primary document)
        |
        `- congressman-document.*:[issue.add.proponents-count] -> `document-congressman.addProponentCountIssue`
                    - Add proponents count to Issue

```
