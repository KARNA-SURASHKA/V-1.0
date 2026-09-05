import os
import firebase_admin
from firebase_admin import firestore, credentials
from typing import Any, Dict, Iterable, List

# Initialize the Firebase app once per process
cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if not cred_path:
    raise RuntimeError("GOOGLE_APPLICATION_CREDENTIALS environment variable is not set")
if not firebase_admin._apps:
    firebase_admin.initialize_app(credentials.Certificate(cred_path))

_db = firestore.client()

# ---------------------------------------------------------------------------
# Generic document helpers
# ---------------------------------------------------------------------------

def doc_ref(collection: str, doc_id: str):
    """Return a reference to a document."""
    return _db.collection(collection).document(doc_id)


def add_document(collection: str, data: Dict[str, Any], doc_id: str | None = None):
    """Add or overwrite a document in the given collection.

    Args:
        collection: Name of the Firestore collection.
        data: Dictionary of fields.
        doc_id: Optional explicit document id. If omitted, Firestore will
                auto‑generate a document ID.
    Returns:
        The WriteResult when an ID is generated or the document reference.
    """
    coll = _db.collection(collection)
    if doc_id:
        ref = coll.document(doc_id)
        ref.set(data)
        return ref
    else:
        return coll.add(data)[1]


def get_document(collection: str, doc_id: str) -> Dict[str, Any] | None:
    """Get a single document as a dictionary."""
    return doc_ref(collection, doc_id).get().to_dict()


def query_documents(collection: str, **filters: Any) -> List[Dict[str, Any]]:
    """Retrieve documents matching simple equality filters.

    Example:
        >>> query_documents('users', role='admin', is_active=True)
    """
    q = _db.collection(collection)
    for field, val in filters.items():
        q = q.where(field, "==", val)
    return [doc.to_dict() for doc in q.stream()]

# ---------------------------------------------------------------------------
# Domain specific helpers – e.g. User queries
# ---------------------------------------------------------------------------

def get_user_by_uid(uid: str) -> Dict[str, Any] | None:
    """Return a user document where firebase_uid matches uid."""
    users = query_documents("users", firebase_uid=uid)
    return users[0] if users else None

# Add more helpers as needed for other entities (e.g., agents, reports).
