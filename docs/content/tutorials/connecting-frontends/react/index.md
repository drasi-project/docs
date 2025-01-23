---
type: "docs"
title: "Connecting a React App to a Query"
toc_hide: true
hide_summary: true
description: >
    Learn how to connect a React App to a continuous query
---

## ReactJS

React components for connecting to a Drasi SignalR Reaction are [published on NPM](https://www.npmjs.com/package/@drasi/signalr-react).

A basic React App has been created using `create-react-app`, under the `02-connect-frontends/react` directory.  This app will use these components to connect to a SignalR hub and display the results of a query in real time.

The following snippet shows the use of the `ResultSet` component in `App.js`.
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
    <ResultSet
      url='http://localhost:8082/hub'
      queryId='hello-world-from'
      sortBy={item => item.MessageFrom}>
      {item =>
        <tr>
          <td>{item.MessageId}</td>
          <td>{item.MessageFrom}</td>
        </tr>
      }
    </ResultSet>
  </tbody>
</table>
```

Open a terminal and navigate to the `02-connect-frontends/react` directory and install the required packages.

```shell
cd 02-connect-frontends/react
```

```shell
npm install
```

Start the React App.

```shell
npm start
```

Browse to http://localhost:3000

{{< figure src="before.png" width="50%" >}}

Now, let's open another terminal and insert a new message into the database.

```shell
psql
```

```sql
INSERT INTO public."Message" VALUES (101, 'ReactJS', 'Hello World');
```

Upon inserting the new row into the database table, the React page should reflect the changes like shown in the screenshot below:

{{< figure src="after.png" width="50%" >}}
