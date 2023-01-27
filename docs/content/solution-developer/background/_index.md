---
type: "docs"
title: "Background"
linkTitle: "Background"
weight: 20
description: >
    What Problem does Drasi Solve?
---

The world is complex and constantly changing. Organizations create ever more sophisticated software systems in an effort to model, reason about, and manage their physical assets and operational activities. The data managed by these software systems can be large and complex, in some instances containing millions of digital entities that represent real-world things like people, vehicles, products, orders, processes, and incidents. These systems can also contain millions of relationships between entities that describe how things in the real world are physically or logically related to each other

As the world changes, the data must also change, resulting in the continual creation and deletion of entities, modifications to the properties that represent the state of the entities, and the creation and deletion of relationships between entities. In large systems, the frequency and volume of change can be very high. 

Being able to react dynamically when this data changes is increasingly important to organizations that want to improve productivity and operational efficiency through the creation of more integrated and responsive software solutions across and between organizations.

Some software systems are designed with built-in change notification capabilities that enable cascading updates within the system or external consumers to observe changes as they occur and react accordingly. But building such systems is difficult and time consuming. For example, if you want to include change notification capabilities in a system you are building, you will need to decide:
- Which actions or operations in your system generate events (i.e an event taxonomy). For a large system there could be hundreds or thousands of actions for which you need to generate events.
- What data to use to describe those changes (i.e. an event schema). This could be very generic using a single schema for all events, or require different schema for different event types.
- Which components and services in your system will generate events and under what circumstances.
- How to distribute the events reliably and efficiently at a scale to meet expected consumer demands.
- How to enable consumer systems to register interest in the events your system generates. The more flexible you make this, by supporting filters and rich query capabilities, the more complex it becomes.
- How to secure your system so that the events you are generating are only accessible to authorized consumers.
- How to test the event generation and distribution.
- How to monitor the eventing functionality and supporting infrastructure in production.
- How to educate developers in the use of your eventing capabilities and make it easy for them to use.

Doing all this successfully (in addition to delivering the system’s primary functionality) requires the developer to have good data modelling skills, a deep understanding of event driven architectures, and experience with messaging infrastructure technology. All of this is in addition to skills in their domain of expertise, like financial services or life sciences. As such, many systems do not include change notification capabilities, or have very simplistic implementations that provide limited value to the developers trying to use them.

Further, observing and reacting to software systems that were not originally designed to generate change notifications presents additional challenges for developers. While the developer still needs to address many of the concerns outlined previously, they must also solve the problem of detecting when changes occur in the source systems. If they are unable to modify the system source code to update components and services to generate change notifications, as is often the case when dealing with third-party or legacy systems, the developer must implement a complex and inefficient work around such as:
- periodically querying (i.e. polling) the source system and comparing results to detect changes over time.
- processing the source change feed and determining, often with complex logic, which low-level changes are relevant.

While there are established patterns and technologies that help developers deal with each of these challenges, the knowledge, skills, and time taken to implement them effectively at scale are beyond the capabilities of many people and organizations. 

**We created Drasi because we believe, the ability to observe systems, detect changes, and react dynamically to those changes is fundamentally too hard and is an area that is ready for disruption.**

