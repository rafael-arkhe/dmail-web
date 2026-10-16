const cbor = require('cbor');
const { blake3 } = require('hash-wasm');
const fs = require('fs');

async function main() {
    const vectors = {};

    function bstr(hexString) {
        return Buffer.from(hexString, 'hex');
    }

    async function computeDigest(domain, data) {
        const canonicalCbor = cbor.encodeOne(data, { canonical: true });
        const prefix = Buffer.from(domain, 'utf8');
        const preimage = Buffer.concat([prefix, canonicalCbor]);
        return await blake3(preimage);
    }

    const intent_digest = await blake3(Buffer.from('dummy_intent_digest', 'utf8'));

    // 1. PolicyRef
    const policyRef = {
        digest: bstr(await blake3(Buffer.from("dummy_policy_digest")))
    };
    vectors.policy_ref = {
        value: policyRef,
        cbor_hex: cbor.encodeOne(policyRef, { canonical: true }).toString('hex')
    };

    // 2. IdentityRef
    const identityRef = {
        scheme: "did",
        value: "did:example:123"
    };
    vectors.identity_ref = {
        value: identityRef,
        cbor_hex: cbor.encodeOne(identityRef, { canonical: true }).toString('hex')
    };

    // 3. PropertyRef
    const propertyRef = {
        name: "some_property",
        version: 1
    };
    vectors.property_ref = {
        value: propertyRef,
        cbor_hex: cbor.encodeOne(propertyRef, { canonical: true }).toString('hex')
    };

    // 4. ScopeExpr
    const scopeExpr = {
        kind: "component",
        value: "frontend"
    };
    vectors.scope_expr = {
        value: scopeExpr,
        cbor_hex: cbor.encodeOne(scopeExpr, { canonical: true }).toString('hex')
    };

    const scopeExprArtifactSet = {
        kind: "artifact_set",
        values: ["file1.txt", "file2.txt"]
    };
    vectors.scope_expr_artifact_set = {
        value: scopeExprArtifactSet,
        cbor_hex: cbor.encodeOne(scopeExprArtifactSet, { canonical: true }).toString('hex')
    };


    // 5. Finding and FindingDisposition
    const evidenceRef = {
        evidence_class: "test_report",
        content_digest: bstr(await blake3(Buffer.from("dummy_content_digest")))
    };

    const subjectRef = {
        kind: "digest",
        value: bstr(intent_digest)
    };

    const finding = {
        code: "V001",
        category: "EVIDENCE_MISSING",
        subject_ref: subjectRef,
        evidence_refs: [evidenceRef]
    };

    vectors.finding = {
        value: finding,
        cbor_hex: cbor.encodeOne(finding, { canonical: true }).toString('hex'),
        digest: await computeDigest("AKG:FINDING:v1\0", finding)
    };

    const findingDisposition = {
        finding_ref: bstr(vectors.finding.digest),
        disposition: "BLOCKING",
        policy_ref: policyRef
    };

    vectors.finding_disposition = {
        value: findingDisposition,
        cbor_hex: cbor.encodeOne(findingDisposition, { canonical: true }).toString('hex')
    };

    // 6. EnvironmentDescriptor
    const measurement = {
        type: "os",
        value_ref: bstr(await blake3(Buffer.from("dummy_os_digest"))),
        alg: "BLAKE3"
    };

    const envCore = {
        environment_version: 1,
        measurements: [measurement]
    };

    const envDigest = await computeDigest("AKG:ENV:v1\0", envCore);

    const environmentDescriptor = {
        environment_version: 1,
        measurements: [measurement],
        environment_digest: bstr(envDigest)
    };

    vectors.environment_descriptor = {
        value: environmentDescriptor,
        cbor_hex: cbor.encodeOne(environmentDescriptor, { canonical: true }).toString('hex')
    };

    // 8. StrongStateCommutationEvidence
    const strongStateCommutation = {
        subject_a: bstr(await blake3(Buffer.from("subject_a"))),
        subject_b: bstr(await blake3(Buffer.from("subject_b"))),
        state_profile_ref: bstr(await blake3(Buffer.from("profile"))),
        equivalence_kind: "exact_canonical_state_equality",
        proof_digest: bstr(await blake3(Buffer.from("proof")))
    };

    vectors.strong_state_commutation = {
        value: strongStateCommutation,
        cbor_hex: cbor.encodeOne(strongStateCommutation, { canonical: true }).toString('hex')
    };

    // 11. SignatureEnvelope
    const signatureEnvelope = {
        algorithm: "ED25519",
        key_id: identityRef,
        signature: bstr("00".repeat(64)), // Dummy 64 byte signature
        signed_at: 1672531200 // 2023-01-01
    };

    vectors.signature_envelope = {
        value: signatureEnvelope,
        cbor_hex: cbor.encodeOne(signatureEnvelope, { canonical: true }).toString('hex')
    };

    // 12. BranchIntegrationStateCore and BranchAttestation
    const dependencyEdge = {
        source: bstr(intent_digest),
        target: bstr(await blake3(Buffer.from("target_intent"))),
        kind: "SEMANTIC"
    };

    const orderingEdge = {
        source: bstr(intent_digest),
        target: bstr(await blake3(Buffer.from("target_intent"))),
        kind: "EXPLICIT_ORDERING",
        reason_ref: bstr(await blake3(Buffer.from("reason")))
    };

    const branchCore = {
        branch_id: "main",
        state_version: 1,
        integrated_intents: [bstr(intent_digest)],
        dependency_graph: [dependencyEdge],
        explicit_ordering_edges: [orderingEdge],
        integration_frontier: [bstr(intent_digest)],
        policy_ref: policyRef
    };

    const branchDigest = await computeDigest("AKG:BRANCH:v1\0", branchCore);

    vectors.branch_integration_state_core = {
        value: branchCore,
        cbor_hex: cbor.encodeOne(branchCore, { canonical: true }).toString('hex'),
        digest: branchDigest
    };

    const branchAttestation = {
        branch_digest: bstr(branchDigest),
        signer: identityRef,
        signature: signatureEnvelope
    };

    vectors.branch_attestation = {
        value: branchAttestation,
        cbor_hex: cbor.encodeOne(branchAttestation, { canonical: true }).toString('hex')
    };

    fs.writeFileSync('conformance_vectors.json', JSON.stringify(vectors, (key, value) => {
        if (value && value.type === 'Buffer') {
            return Buffer.from(value.data, { canonical: true }).toString('hex');
        }
        return value;
    }, 2));

    console.log("Generated conformance vectors.");
}

main().catch(console.error);
