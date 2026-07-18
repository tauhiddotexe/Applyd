from langgraph.graph import StateGraph, END
from .state import ResumeState
from .nodes import (
    preprocess,
    call_extract_llm,
    extract_ground_truth,
    call_analyze_llm,
    call_tailor_llm,
    validate_tailored,
    score_final,
)


def _should_retry(state: ResumeState) -> str:
    if state.get("error") == "validation_failed" and state.get("retries", 0) < 2:
        return "retry"
    return "continue"


def _has_error(state: ResumeState) -> bool:
    return bool(state.get("error")) and state["error"] != "validation_failed"


analyze_graph = StateGraph(ResumeState)
analyze_graph.add_node("preprocess", preprocess)
analyze_graph.add_node("extract_llm", call_extract_llm)
analyze_graph.add_node("analyze_llm", call_analyze_llm)
analyze_graph.set_entry_point("preprocess")
analyze_graph.add_edge("preprocess", "extract_llm")
analyze_graph.add_edge("extract_llm", "analyze_llm")
analyze_graph.add_edge("analyze_llm", END)
analyze_compiled = analyze_graph.compile()


tailor_graph = StateGraph(ResumeState)
tailor_graph.add_node("preprocess", preprocess)
tailor_graph.add_node("extract_llm", call_extract_llm)
tailor_graph.add_node("extract_ground_truth", extract_ground_truth)
tailor_graph.add_node("tailor_llm", call_tailor_llm)
tailor_graph.add_node("validate", validate_tailored)
tailor_graph.add_node("score_final", score_final)
tailor_graph.set_entry_point("preprocess")
tailor_graph.add_edge("preprocess", "extract_llm")
tailor_graph.add_edge("extract_llm", "extract_ground_truth")
tailor_graph.add_edge("extract_ground_truth", "tailor_llm")
tailor_graph.add_conditional_edges(
    "tailor_llm",
    _has_error,
    {True: END, False: "validate"},
)
tailor_graph.add_conditional_edges(
    "validate",
    _should_retry,
    {"retry": "tailor_llm", "continue": "score_final"},
)
tailor_graph.add_edge("score_final", END)
tailor_compiled = tailor_graph.compile()
