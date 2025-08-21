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

Additionally, if you are using an Azure Application Gateway or AWS Load Balancer controller as your ingress controller, you can specify the public IP address of the Application Gateway using the `--gateway-ip-address` flag.

Azure Application Gateway:
```bash
drasi ingress init --use-existing --ingress-class-name azure-application-gateway --gateway-ip-address <ip-address>
```

AWS Load Balancer:
```bash
drasi ingress init --use-existing --ingress-class-name alb --gateway-ip-address <ip-address>
```

For more information on setting up Azure Application Gateway or AWS Load Balancer controller, refer to this [documentation](/reference/ingress)