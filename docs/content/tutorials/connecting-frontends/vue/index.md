---
type: "docs"
title: "Connecting a Vue App to a Query"
toc_hide: true
hide_summary: true
description: >
    Learn how to connect a Vue App to a continuous query
---


## VueJS

Vue components for connecting to a Drasi SignalR Reaction are [published on NPM](https://www.npmjs.com/package/@drasi/signalr-vue).

A basic Vue App has been created under the `02-connect-frontends/vue` directory.  This app will use these components to connect to a SignalR hub and display the results of a query in real time.

The following snippet shows the use of the `ResultSet` component in `App.vue`.
It takes a URL that points to the SignalR hub, a queryId that identifies the query to subscribe to, and a sortBy function that will be used to sort the results.

```html
<table>
  <thead>
    <tr>
      <th>Message ID</th>
      <th>Message From</th>
    </tr>
  </thead>
  <tbody>
    <ResultSet url="http://localhost:8082/hub" queryId="hello-world-from" :sortBy="x => x.MessageFrom">
      <template #default="{ item, index }">
        <tr>
          <td>{{ item.MessageId }}</td>
          <td>{{ item.MessageFrom }}</td>
        </tr>
      </template>
    </ResultSet>
  </tbody>
</table>
```

Opeb a terminal and navigate to the `02-connect-frontends/vue` directory and install the required packages.

```shell
cd 02-connect-frontends/vue
```

```shell
npm install
```

Start the Vue App.

```shell
npm run dev
```

Browse to http://localhost:5173

{{< figure src="before.png" width="50%" >}}

Now, let's open another terminal and insert a new message into the database.

```shell
psql
```

```sql
INSERT INTO public."Message" VALUES (101, 'VueJS', 'Hello World');
```

{{< figure src="after.png" width="50%" >}}
