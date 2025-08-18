To install the Contour ingress controller, run the following command:

```bash
drasi ingress init
```
The CLI will use helm to install the Contour ingress controller in the default 'project-contour' namespace.

To use an existing ingress controller, run the following command:

```bash
drasi ingress init --use-existing --ingress-service-name <name> --ingress-namespace <namespace> --ingress-class-name <name>
```

For instance, to use an existing NGINX ingress controller with the service name `ingress-nginx-controller` in the `ingress-nginx` namespace, execute the following command.

```bash
drasi ingress init --use-existing --ingress-service-name nginx-ingress --ingress-namespace ingress-nginx --ingress-class-name nginx
```