#### Install Contour Ingress Controller (Default)

To install the Contour ingress controller, run the following command:

```bash
drasi ingress init
```
The CLI will use helm to install the Contour ingress controller in the default 'projectcontour' namespace.

You can also install Contour with custom annotations:

```bash
drasi ingress init --ingress-annotation "<name>=<value>" --ingress-annotation "<name2>=<value2>"
```

#### Use Existing Ingress Controller

To use an existing ingress controller, run the following command:

```bash
drasi ingress init --use-existing --ingress-service-name <name> --ingress-namespace <namespace> --ingress-class-name <name>
```

You can also add custom annotations if needed:

```bash
drasi ingress init --use-existing --ingress-service-name <name> --ingress-namespace <namespace> --ingress-class-name <name> --ingress-annotation "<name>=<value>" --ingress-annotation "<name2>=<value2>"
```

For instance, to use an existing NGINX ingress controller with the service name `ingress-nginx-controller` in the `ingress-nginx` namespace:

```bash
drasi ingress init --use-existing --ingress-service-name ingress-nginx-controller --ingress-namespace ingress-nginx --ingress-class-name nginx
```


For more information on setting up Azure Application Gateway or AWS Load Balancer controller, refer to this [documentation](/reference/ingress)