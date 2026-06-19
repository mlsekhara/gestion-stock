"""Catalogue des permissions (droits d'accès) et rôles par défaut.

Les permissions suivent la convention ``module:action``. Le rôle « Administrateur »
possède le joker ``*`` qui accorde tous les droits.
"""

# --- Permissions par module --------------------------------------------------
PERMISSIONS: dict[str, str] = {
    # Catalogue & stock
    "articles:lire": "Consulter les articles",
    "articles:gerer": "Créer / modifier / supprimer des articles",
    "stock:lire": "Consulter le stock et les mouvements",
    "stock:gerer": "Effectuer des mouvements de stock et inventaires",
    # Achats
    "achats:lire": "Consulter les achats",
    "achats:gerer": "Créer / valider des achats",
    # Ventes
    "ventes:lire": "Consulter les ventes",
    "ventes:gerer": "Créer / valider des ventes",
    # Tiers
    "tiers:lire": "Consulter clients et fournisseurs",
    "tiers:gerer": "Gérer clients et fournisseurs",
    # Tableau de bord
    "tableau_de_bord:lire": "Consulter le tableau de bord",
    # Primes
    "primes:lire": "Consulter sa propre prime",
    # Paramétrage
    "parametres:gerer": "Gérer les paramètres, utilisateurs et magasins",
}

WILDCARD = "*"

# --- Rôles par défaut --------------------------------------------------------
DEFAULT_ROLES: dict[str, dict] = {
    "Administrateur": {
        "description": "Accès complet à l'entreprise",
        "permissions": [WILDCARD],
    },
    "Gestionnaire": {
        "description": "Gère le stock, les achats et les ventes",
        "permissions": [
            "articles:lire", "articles:gerer",
            "stock:lire", "stock:gerer",
            "achats:lire", "achats:gerer",
            "ventes:lire", "ventes:gerer",
            "tiers:lire", "tiers:gerer",
            "tableau_de_bord:lire",
        ],
    },
    "Vendeur": {
        "description": "Réalise les ventes et consulte le stock",
        "permissions": [
            "articles:lire",
            "stock:lire",
            "ventes:lire", "ventes:gerer",
            "tiers:lire", "tiers:gerer",
            "primes:lire",
        ],
    },
}


def has_permission(granted: list[str], required: str) -> bool:
    """Vrai si la liste de permissions accorde la permission demandée."""
    return WILDCARD in granted or required in granted
