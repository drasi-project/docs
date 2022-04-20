# login
az login

# set default subscription
az account set --subscription "Azure Incubations Dev"

# SOURCES
## Create a new EventGrid Topic for a source
az eventgrid domain topic create \
    --resource-group reactive-graph-dev \
    --domain-name reactive-graph-dev-source \
    --name source-name


## Delete an EventGrid Topic for a source
az eventgrid domain topic delete \
    --resource-group reactive-graph-dev \
    --domain-name reactive-graph-dev-source \
    --name source-name

# QUERY
## Create a new EventHub for a Continuous Query
az eventhubs eventhub create \
    --resource-group reactive-graph-dev \
    --namespace-name reactive-graph-dev-query \
    --name test-query-name \
    --message-retention 1

## Subscribe the query EventHub to the Source EventGridTopic
az eventgrid event-subscription create \
    --source-resource-id /subscriptions/2865c7d1-29fa-485a-8862-717377bdbf1b/resourceGroups/reactive-graph-dev/providers/Microsoft.EventGrid/domains/reactive-graph-dev-source/topics/contoso-humanresources \
    --endpoint-type eventhub \
    --endpoint /subscriptions/2865c7d1-29fa-485a-8862-717377bdbf1b/resourceGroups/reactive-graph-dev/providers/Microsoft.eventhub/namespaces/reactive-graph-dev-query/eventhubs/crisis-alert \
    --name contoso-humanresources---crisis-alert
    