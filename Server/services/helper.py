import re
# Document Loaders
from langchain_community.document_loaders import PyPDFLoader,DirectoryLoader
# Text Splitters
from langchain_experimental.text_splitter import SemanticChunker
from typing import List
from langchain_core.documents import Document
# Vector stores
# from langchain_community.vectorstores import Pinecone as PineconeVectorStore
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone as PineconeClient, ServerlessSpec
# Open Source Models
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEndpointEmbeddings
# Import runnables
from langchain_core.runnables import (
    RunnableParallel,
    RunnablePassthrough,
    RunnableLambda
)
# Loading data from .env files
from dotenv import load_dotenv
load_dotenv()

# Load LLM
def load_llm(model):
    llm = ChatGroq(
        model=model
    )
    return llm

# Load Embedding Model (uses HuggingFace Inference API — no local torch/model download)
def load_embedding_model(embedding_model):
    embedding = HuggingFaceEndpointEmbeddings(
        model=embedding_model,
    )
    return embedding

# Load PDF Files
def load_pdf(folder):
    loader = DirectoryLoader(
        folder,
        glob="*.pdf",
        loader_cls=PyPDFLoader
    )
    docs = loader.load()
    return docs



def filter_documents(docs):
    minimal_docs: List[Document] = []
    for doc in docs:
        src = doc.metadata.get("source")
        minimal_docs.append(
            Document(
                page_content=doc.page_content,
                metadata={'source':src}
            )
        )
    return minimal_docs


def chunk_text_semantically(docs,embedding_model):
    # use semantic chunker
    splitter = SemanticChunker(
        embedding_model,breakpoint_threshold_type="standard_deviation",
        breakpoint_threshold_amount=1
    )
    chunks = splitter.split_documents(docs)
    return chunks


def create_database(index_name, chunks, embedding_model, api_key):
    # Initialize Pinecone client
    pc = PineconeClient(api_key=api_key)

    # Create index if not exists
    dimension = len(embedding_model.embed_query("test"))
    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name=index_name,
            dimension=dimension,
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )

    # Create vector store
    docsearch = PineconeVectorStore.from_documents(
        documents=chunks,
        embedding=embedding_model,
        index_name=index_name
    )

    return docsearch


def get_retriever(vector_store):
    return vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k":3}
    )

def extract_sources(docs):
    sources = []
    for doc in docs:
        sources.append({
            "score": doc.metadata.get("score"),
            "snippet": doc.page_content[:300],
            "source": doc.metadata.get("source")
        })
    return sources

# def create_chain(retriever,llm,parser,template):

#     parallel_chain = RunnableParallel({
#         "question": RunnablePassthrough(),
#         "context": retriever | RunnableLambda(lambda context: "\n\n".join(doc.page_content for doc in context))
#     })

#     chain = parallel_chain | template | llm | parser 

#     return chain

def create_chain(retriever, llm, parser, template):

    def format_context(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    chain = (
        RunnableParallel({
            "question": RunnablePassthrough(),
            "docs": retriever
        })
        | RunnableLambda(lambda x: {
            "question": x["question"],
            "context": format_context(x["docs"]),
            "sources": extract_sources(x["docs"])
        })
        | RunnableLambda(lambda x: {
            "answer": parser.invoke(llm.invoke(template.format(**x))),
            "sources": x["sources"]
        })
    )

    return chain


def markdown_to_text(md_text: str) -> str:
    # Remove bold and italics
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', md_text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    # Replace bullet points
    text = text.replace("- ", "• ")
    # Replace escaped newlines
    text = text.replace("\\n", "\n")
    return text.strip()