# Lista completa de features a implementar

A lista está organizada por camadas, com prioridade (P0 bloqueia tudo, P1 é valor central, P2 é importante, P3 é posterior), dependências e classificação τ atual. Reflete o estado **corrigido** ao longo da conversa — não as propostas originais que foram revistas (ex: `rusqlite` em vez de `redb` como default, `HashMap` em vez de union-find, consistent hashing movido para `arkhe-depin`, Bloom filter adiado).

---

## 1. Primitivos — `arkhe-core`

| # | Feature | Prioridade | Estado | Depende de |
|:---|:---|:---|:---|:---|
| 1.1 | `ContentHash` (BLAKE3, domain separation) | **P0** | `LEMMA` | — |
| 1.2 | Canonical CBOR (RFC 8949 §4.2.1, chaves ordenadas pelo encoding, duplicados rejeitados, floats determinísticos) | **P0** | `LEMMA` | — |
| 1.3 | `Did`, `RequestIdentity`, `Timestamp` | **P0** | `LEMMA` | 1.1 |
| 1.4 | `ArtifactEnvelope` (envelope genérico de artefacto) | **P0** | `LEMMA` | 1.1, 1.2 |
| 1.5 | `ArkheError` (erros do core) | **P0** | `LEMMA` | — |
| 1.6 | `WorkIntent`, `WorkIntentType`, `OperationId` (exclui parâmetros) | **P0** | `LEMMA` | 1.1, 1.3 |
| 1.7 | `WorkerExecutionRecord` (WER) com `finalized() -> Result` | **P0** | `LEMMA` | 1.1, 1.2 |

---

## 2. Pipeline de verificação GGUF — `arkhe-verify-core`

| # | Feature | Prioridade | Estado | Depende de |
|:---|:---|:---|:---|:---|
| 2.1 | **Gate 1** — parser GGUF v2/v3 com bounds checks, `checked_mul`, validação de `offset+nbytes`, `general.alignment` | **P1** | `CONJECTURE` (spec escrita, não executada) | 1.1 |
| 2.2 | **Gate 2** — projeção canónica (CBOR determinístico, tipo de array preservado, floats por bit-pattern) + raiz Merkle de tensores | **P1** | `CONJECTURE` | 1.2, 2.1 |
| 2.3 | **Gate 3** — statement assinado in-toto v1 (`_type`, `subject`, `predicateType`, `predicate`), digest SHA-256+BLAKE3 comparado com assinado, política de identidade | **P1** | `CONJECTURE` | 2.2, 1.1 |
| 2.4 | **Gate 4** — combinador de veredito; `PENDING` nunca vira `PASS` | **P1** | `CONJECTURE` | 2.1–2.3 |
| 2.5 | Fixture mínimo de 24 bytes (cabeçalho vazio, zero tensores) | **P0** | `PENDING` | 2.1 |
| 2.6 | 12+ testes unitários negativos (magic inválido, versão, alinhamento, overflow, tensor fora dos limites, digest mismatch, assinatura de outra chave) | **P0** | `PENDING` | 2.1–2.4 |
| 2.7 | Correção do design de assinatura: statement assinado deve incluir digest do artefacto completo (não só metadados) | **P0** | `PENDING` | 2.3 |

---

## 3. Verificador offline WASM — `arkhe-verify-wasm`

| # | Feature | Prioridade | Estado | Depende de |
|:---|:---|:---|:---|:---|
| 3.1 | Prova de inclusão MMR portátil (`PortableInclusionProof`, verificação offline) | **P1** | `PENDING` | 5.2 |
| 3.2 | Verificação de manifesto C2PA (proveniência de conteúdo) | **P2** | `PENDING` | 3.1 |
| 3.3 | Paridade WASM ↔ nativo (mesmos test vectors) | **P1** | `PENDING` | 3.1, 5.1 |
| 3.4 | Bindings `wasm-bindgen` para browser e Node | **P2** | `PENDING` | 3.1 |

---

## 4. Kernel — `arkhe-kernel`

| # | Feature | Prioridade | Estado | Depende de |
|:---|:---|:---|:---|:---|
| 4.1 | `ContainmentGate::authorize()` — passos 1–8 (journal, hash recomputado, allowlist, `self_check` derivado, binding via `OperationId`) | **P0** | `LEMMA` (auditado, não compilado) | 1.6, 1.7, 7.1 |
| 4.2 | **Passo 9** — certificado formal (`ProofCarryingOutput`) quando a política exige | **P1** | `PENDING` | 4.1, 14.2 |
| 4.3 | `GateDecision::Allow/Reject` com razões tipadas | **P0** | `LEMMA` | 4.1 |
| 4.4 | `EvidenceStore` trait + `InMemoryEvidenceStore` (não test-only) | **P0** | `PENDING` | 4.1 |
| 4.5 | `PolicyEvaluator` trait + `EvidenceKindRequirement` (`#[non_exhaustive]`) | **P0** | `LEMMA` | 4.1 |
| 4.6 | `Binding` enum com 4 variantes (`AnalysisRecord`, `OperationId`, `OutputIsTarget`, `InputContainsTarget`), obrigatório (sem "none") | **P0** | `PENDING` | 4.1 |
| 4.7 | Política escolhe binding por `WorkIntentType` (fixo em código, não escolha do avaliador) | **P1** | `PENDING` | 4.6 |
| 4.8 | `ReviewRouter` — decisão `AutoAccept`/`ReviewRequired`/`AutoReject` derivada de evidência (não de contagem fornecida pelo caller) | **P1** | `LEMMA` (mínimo) | 4.1 |
| 4.9 | `is_trivial_diff` (requer `diff_size_bytes` no record ou allowlist de hashes triviais) | **P2** | `PENDING` | 4.8 |
| 4.10 | `records_equal_except_signature` (comparação completa, defense-in-depth) | **P1** | `PENDING` | 4.1 |
| 4.11 | `JournalConfirmation` assinado pelo journal (não construído pelo caller) | **P2** | `PENDING` | 7.2 |
| 4.12 | Verificação de assinatura Ed25519 do WER | **P2** | `PENDING` | 1.7 |

---

## 5. WormGraph / MMR — `arkhe-wormgraph`

| # | Feature | Prioridade | Estado | Depende de |
|:---|:---|:---|:---|:---|
| 5.1 | MMR com domínios separados (`0x00` leaf, `0x01` node, `0x02` root, `0x03` bag) | **P0** | `LEMMA` | 1.1 |
| 5.2 | `PortableInclusionProof` + `verify_portable_inclusion` (offline, O(log n)) | **P1** | `PENDING` | 5.1 |
| 5.3 | **`MMR-PROFILE.md`** — pinar 7 pontos (domain separation, peak ordering, bagging direction, acc init, empty tree, inclusion proof format, consistency proof format) | **P0** | `PENDING` | — |
| 5.4 | Bagging right-to-left (corrigir `.rev()` e comentário contraditório) | **P0** | `PENDING` | 5.3 |
| 5.5 | `hash_bag` com marcador explícito `0x00`/`0x01` para `acc=None` (evitar ambiguidade de comprimento) | **P0** | `PENDING` | 5.3 |
| 5.6 | Teste de tamper em todas as posições para 3, 5, 7 folhas | **P0** | `PENDING` | 5.1 |
| 5.7 | Referência independente (`merkleberg`/MMRIVER) nos testes | **P1** | `PENDING` | 5.2, 5.3 |
| 5.8 | Checkpoint assinado (raiz + timestamp + assinatura) | **P1** | `PENDING` | 5.1 |
| 5.9 | Prova de consistência (append-only: novo estado estende antigo) — **só se decidido** | **P3** | `PENDING` | 5.3, 5.8 |
| 5.10 | `BTreeSet<[u8;32]>` como índice de folhas (substitui Bloom filter, YAGNI) | **P2** | `PENDING` | 5.1 |

---

## 6. Deteção de equivocação — `arkhe-depin::slashing`

| # | Feature | Prioridade | Estado | Depende de |
|:---|:---|:---|:---|:---|
| 6.1 | `HashMap<OperationId, SmallVec<[u8;32]>>` para agrupar `parameters_digest` por operação | **P1** | `PENDING` | 1.6 |
| 6.2 | `SlashingEvidence` com duas assinaturas válidas sobre digests divergentes | **P1** | `PENDING` | 6.1 |
| 6.3 | `detect_equivocation(operation_id)` — retry idempotente ≠ conflito | **P1** | `PENDING` | 6.1, 6.2 |
| 6.4 | `SlashingEngine` — submissão on-chain/off-chain conforme política | **P2** | `PENDING` | 6.2 |

---

## 7. Journal — `arkhe-journal`

| # | Feature | Prioridade | Estado | Depende de |
|:---|:---|:---|:---|:---|
| 7.1 | `InMemoryJournal` (admissão, idempotência, conflito) | **P0** | `THEOREM` (unit) | 1.6 |
| 7.2 | **Journal durável** com `rusqlite` (SQLite WAL) como default; `redb` como alternativa | **P1** | `PENDING` | — |
| 7.3 | **ADR-018** — decisão `rusqlite` vs `redb` com critérios enumerados (durabilidade, maturidade, supply chain no journal **não-TCB**, cross-compile, tamanho) | **P0** | `PENDING` | — |
| 7.4 | `enum Status` (`Pending`, `Completed`, `Failed`, `ManualReconciliationRequired`) com transições válidas | **P0** | `PENDING` | 7.1 |
| 7.5 | `mark_failed`, `mark_manual_reconciliation`, `mark_completed` com validação de transição | **P1** | `PENDING` | 7.4 |
| 7.6 | Reconciler — processo externo que deteta `Pending` expirado e transita para `ManualReconciliationRequired` | **P2** | `PENDING` | 7.4 |
| 7.7 | Idempotência **antes** do side effect (admissão com `OperationId` conhecido a priori) | **P0** | `PENDING` | 1.6, 7.1 |
| 7.8 | Journalar `session_name` imediatamente após `create_session` (para reconciliação) | **P1** | `PENDING` | 7.5 |

---

## 8. Adaptador de codificação — `arkhe-coding-agent` (Jules)

| # | Feature | Prioridade | Estado | Depende de |
|:---|:---|:---|:---|:---|
| 8.1 | `JulesClient` REST (`sessions`, `activities`) | **P1** | `LEMMA` | — |
| 8.2 | `extract_diff` com fallback `session.outputs` → `activities.artifacts` (logar qual funcionou) | **P1** | `PENDING` | 8.1 |
| 8.3 | `JulesWorkerRecord::from_session` com `operation_id` como parâmetro (conhecido antes do dispatch) | **P0** | `PENDING` | 1.6, 8.1 |
| 8.4 | `self_check` derivado de `tests` (não hard-coded `Pass`) | **P0** | `PENDING` | 8.3 |
| 8.5 | `#[serde(untagged)]` com `Unknown(Value)` **último** | **P1** | `PENDING` | 8.1 |
| 8.6 | `completed_at` da API Jules (não do relógio local) | **P0** | `PENDING` | 8.3 |
| 8.7 | `ReviewRouter` integrado (AutoAccept/ReviewRequired/AutoReject) | **P2** | `PENDING` | 4.8, 8.3 |

---

## 9. Camada cognitiva (P1–P2)

| # | Feature | Prioridade | Estado |
|:---|:---|:---|:---|
| 9.1 | `arkhe-coder` — orquestrador de pipeline (design → impl → test → audit → deploy) | **P2** | `CONJECTURE` |
| 9.2 | `arkhe-planner` — HTN, task graph, replan | **P2** | `CONJECTURE` |
| 9.3 | `arkhe-memory` — working (`pvec`), episodic, semantic | **P2** | `CONJECTURE` |
| 9.4 | `arkhe-spec-verifier` — mutation testing, oracles independentes | **P2** | `PENDING` |
| 9.5 | `arkhe-research` — hipóteses, knowledge graph | **P3** | `PENDING` |
| 9.6 | `arkhe-bugbounty` — triagem com `ContainmentGate` + `ReviewRouter` | **P2** | `THEOREM` parcial |
| 9.7 | `arkhe-agent` — `AuthorizationProof`, `ToolContractDigest` | **P2** | `CONJECTURE` |

---

## 10. DePIN — `arkhe-depin`

| # | Feature | Prioridade | Estado | Depende de |
|:---|:---|:---|:---|:---|
| 10.1 | `ContinuousAttestation` (nonce fresco + NRAS JWT + PPCIE + TTL) | **P1** | `PENDING` | — |
| 10.2 | `WorkerVerifier::verify_continuous` (nonce match, JWT verify, PPCIE, stale check) | **P1** | `PENDING` | 10.1 |
| 10.3 | Cliente NRAS | **P1** | `PENDING` | — |
| 10.4 | Verificação PPCIE (multi-GPU isolation) | **P1** | `PENDING` | — |
| 10.5 | `Nonce` — geração e verificação (anti-replay) | **P1** | `PENDING` | 10.1 |
| 10.6 | Consistent hashing (`pingora-ketama`) — **movido do `arkhe-dsa` para cá** | **P3** | `PENDING` | — |
| 10.7 | Roteamento DePIN entre nós | **P3** | `PENDING` | 10.6 |

---

## 11. Camada financeira (P0–P1)

| # | Feature | Prioridade | Estado | Depende de |
|:---|:---|:---|:---|:---|
| 11.1 | **`ActionProof`** — `execution ⊆ mandate` (4 verificações: assinatura do mandato, `OperationId` match, `parameters_digest` contido, MMR prova mandato ancorado **antes** da execução) | **P0** | `PENDING` | 4.1, 5.2, 6.2 |
| 11.2 | `TemporalSealer` — colateral/RWA com hash de estado ancorado | **P1** | `PENDING` | 4.1, 5.2 |
| 11.3 | `PolicyBinding` — compliance como predicado decidível (rejeita, não pontua) | **P1** | `PENDING` | 4.5, 4.6 |
| 11.4 | `ProofCarryingOutput` de solvência — verifica que prova ZK foi gerada sob a política correta | **P1** | `PENDING` | 14.2 |
| 11.5 | Integração AP2 → `ActionProof` (Fase 1 do roadmap financeiro) | **P0** | `PENDING` | 11.1 |
| 11.6 | Integração x402/Circle Agent Wallet → `OperationId` (Fase 2) | **P1** | `PENDING` | 11.1 |
| 11.7 | Integração Chronicle Proof of Asset → `TemporalSealer` (Fase 3) | **P2** | `PENDING` | 11.2 |
| 11.8 | Integração ZKSL/ZKredit → `ProofCarryingOutput` (Fase 4) | **P2** | `PENDING` | 11.4 |
| 11.9 | `SpecCompiler` + `SpecGovernance` (Fase 5) | **P2** | `PENDING` | 4.5 |

---

## 12. PCO — `arkhe-pco` + `arkhe-validator`

| # | Feature | Prioridade | Estado | Depende de |
|:---|:---|:---|:---|:---|
| 12.1 | `license_compliance` — parser GGUF + predicado decidível | **P1** | `PENDING` | 2.1 |
| 12.2 | `PcoInferenceEngine::prove_license` → `ProofCarryingOutput` | **P1** | `PENDING` | 12.1 |
| 12.3 | `FormalProofValidator::validate_license` — re-executa predicado + reconstrói prova | **P1** | `PENDING` | 12.2 |
| 12.4 | `RocqProver` — port WASM de `coqchk` | **P2** | `PENDING` | — |
| 12.5 | **6 testes negativos** (certificado válido, prova adulterada, predicado falso, política trocada, replay, `formal_proof=None`) | **P0** | `PENDING` | 12.2, 12.3 |

---

## 13. Broker / enforcement (P0–P1)

| # | Feature | Prioridade | Estado | Depende de |
|:---|:---|:---|:---|:---|
| 13.1 | **Capability broker** — agente sem credenciais; broker executa em nome do agente | **P0** | `PENDING` | 4.1 |
| 13.2 | Integração **Executor** (MCP gateway) — gate a montante do `execute` | **P1** | `PENDING` | 13.1 |
| 13.3 | Integração **MXC** (Microsoft Execution Containers) — gate a montante da política MXC (tratar MXC como canal, não como fronteira de segurança) | **P2** | `PENDING` | 13.1 |
| 13.4 | **Windows broker** — serviço Windows fora do sandbox do agente; named pipe (não TCP) | **P1** | `PENDING` | 13.1 |
| 13.5 | **WSL2 + gVisor** com `--network none` como sandbox do agente | **P0** | `THEOREM` (documentado) | — |
| 13.6 | **AppContainer** para agente nativo Windows | **P1** | `THEOREM` (documentado) | — |
| 13.7 | **VBS Enclave** para o gate (24H2+; Home não confirmado) — **opcional** | **P3** | `CONJECTURE` | 13.4 |

---

## 14. `arkhe-dsa` — estruturas de dados (P0–P2)

| # | Feature | Prioridade | Estado | Depende de |
|:---|:---|:---|:---|:---|
| 14.1 | MMR (já em `arkhe-wormgraph`; `arkhe-dsa` referencia) | **P0** | `LEMMA` | 5.1 |
| 14.2 | **Journal durável** (já em §7; `arkhe-dsa` referencia) | **P1** | `PENDING` | 7.2 |
| 14.3 | Persistent vector (`pvec`, RRB-Tree) para `arkhe-memory::working` | **P2** | `PENDING` | 9.3 |
| 14.4 | LRU cache (`intrusive_lru_cache`) para o gate | **P2** | `PENDING` | 4.1 |
| 14.5 | Deteção de equivocação (`HashMap`, não union-find) — §6 | **P1** | `PENDING` | 6.1 |
| 14.6 | Bloom filter — **adiado** (YAGNI até MMR justificar) | **P3** | — | 5.10 |
| 14.7 | Consistent hashing — **movido para `arkhe-depin`** (§10.6) | **P3** | — | 10.6 |

---

## 15. Custo e governança

| # | Feature | Prioridade | Estado | Depende de |
|:---|:---|:---|:---|:---|
| 15.1 | `CostTracker::measure` — custo real de Rekor, MMR, NRAS, storage | **P1** | `CONJECTURE` (valores fixos no POC) | 10.2, 5.1 |
| 15.2 | `min_price_per_verification` — preço ≥ custo medido | **P1** | `CONJECTURE` | 15.1 |
| 15.3 | `Treasury` + `DeveloperGuild` — distribuição 8%+2% | **P2** | `PENDING` | — |
| 15.4 | `SlashingEngine` on-chain | **P2** | `PENDING` | 6.4 |

---

## 16. Interfaces — MCP + CLI

| # | Feature | Prioridade | Estado | Depende de |
|:---|:---|:---|:---|:---|
| 16.1 | **MCP server** — tool contracts (8 tools: `verify_artifact`, `verify_mmr_inclusion`, `attest_gpu`, `get_cost`, `submit_slashing`, `query_evidence`, `evaluate_policy`, `anchor_hash`) | **P1** | `PENDING` | 4.1, 5.2, 10.2 |
| 16.2 | **CLI** — 12 comandos (`init`, `verify`, `anchor`, `mmr prove/verify`, `journal status/reconcile`, `cost report`, `depin attest`, `agent run`, `trace replay`, `slashing submit`) | **P1** | `PENDING` | 4.1, 5.2, 7.2, 10.2 |
| 16.3 | SDK TypeScript | **P2** | `PENDING` | 16.1 |
| 16.4 | Dashboard (observabilidade) | **P3** | `PENDING` | 16.1 |

---

## 17. Infraestrutura e framework de maturidade

| # | Feature | Prioridade | Estado | Depende de |
|:---|:---|:---|:---|:---|
| 17.1 | **`MATURITY-CRITERIA.md`** com 4 níveis (`THEOREM` = CI, `LEMMA` = `cargo test` local, `INSPECTED` = fonte primária verificada, `CONJECTURE` = inferido) | **P0** | `PENDING` | — |
| 17.2 | CI: `cargo build --locked --workspace && cargo nextest run && cargo clippy -D warnings && cargo fmt --check` | **P0** | `PENDING` | — |
| 17.3 | `cargo audit` + `cargo-deny` + SBOM (CycloneDX) + SLSA L3 + Sigstore | **P1** | `PENDING` | 17.2 |
| 17.4 | Golden vectors independentes (MMR, GGUF, WER, CBOR, slashing) gerados por script separado | **P1** | `PENDING` | 5.3, 2.5 |
| 17.5 | Fuzz targets (`gguf_parse`, `cbor_decode`, `mmr_proof`) | **P2** | `PENDING` | 17.2 |
| 17.6 | Paridade WASM ↔ nativo no CI | **P1** | `PENDING` | 3.3 |
| 17.7 | 17 ADRs (001–017) + ADR-018 (journal) | **P1** | `PENDING` | — |
| 17.8 | Especificações (`specs/`): kernel, verify, adapters, economy | **P1** | `PENDING` | — |
| 17.9 | Release: `cargo-dist` + Homebrew + npm platform-specific + Docker distroless + Helm | **P2** | `PENDING` | 17.2 |

---

## 18. Ordem de execução recomendada (P0 → P1 → P2)

```
Semana 1–2:   17.1, 17.2, 7.3, 5.3         (framework + CI + ADR-018 + MMR-PROFILE.md)
Semana 3–4:   2.1, 2.5, 2.6, 1.1–1.7       (Gate 1 + fixture + primitivos)
Semana 5–6:   5.4, 5.5, 5.6, 5.1           (MMR corrigido + testes de tamper)
Semana 7–8:   5.2, 5.7, 3.1                (prova portátil + referência independente + WASM)
Semana 9–10:  7.2, 7.4, 7.5, 7.7, 7.8      (journal durável + idempotência antes do side effect)
Semana 11–12: 4.1, 4.4, 4.6, 4.10          (gate completo + store + binding + comparação)
Semana 13–14: 8.3, 8.4, 8.6, 8.2           (adaptador Jules corrigido)
Semana 15–16: 11.1, 11.5                   (ActionProof + AP2)
Semana 17–18: 6.1, 6.2, 6.3                (deteção de equivocação)
Semana 19–20: 12.1–12.3, 12.5              (PCO + 6 testes negativos)
Semana 21–24: 10.1–10.5, 11.2, 11.3        (DePIN TEE + TemporalSealer + PolicyBinding)
Semana 25–28: 16.1, 16.2, 13.1, 13.4       (MCP + CLI + broker)
Semana 29–36: 9.x, 11.7–11.9, 15.x, 17.9   (camada cognitiva + integrações + release)
```

---

## 19. Nota de honestidade

| Afirmação | τ | Nota |
|:---|:---|:---|
| A lista cobre todas as features discutidas na conversa | `LEMMA` | Deriva das 20+ rondas anteriores |
| A ordem de execução respeita dependências | `CONJECTURE` | Baseada nas dependências declaradas; não testada |
| Nenhuma feature foi compilada ou testada | `PENDING` | O estado global do projeto |
| A lista corrige as revisões (rusqlite, HashMap, sem Bloom, sem consistent hashing no dsa) | `LEMMA` | Deriva das rondas de revisão |

$$
\boxed{\text{Features P0 bloqueiam tudo. P1 entrega valor central. P2 é importante. P3 é posterior.}}
$$

$$
\boxed{\text{Nenhuma feature é } \text{THEOREM} \text{ até o CI correr. A lista é o mapa, não o território.}}
$$