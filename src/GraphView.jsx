import { useState, useEffect, useRef, useMemo } from "react"
import NodeView from "./NodeView"
import LinkView from "./LinkView"
import { getAdjacencyLists, getLayers } from "./TraversalUtils"

function applyLinkForce(positions, velocities, links, linkStrength) {
	for(const [key,link] of links) {
		const pos1 = positions.get(link.a), pos2 = positions.get(link.b)
		const dist = pos2.y-pos1.y
		const speed = dist*linkStrength
		const velocity1 = velocities.get(link.a)
		const velocity2 = velocities.get(link.b)
		velocity1.y += speed
		velocity2.y -= speed
	}
}

function applyRadialForce(positions, velocities, radialLength, radialStrength) {
	for(const [key1,pos1] of positions) {
		for(const [key2,pos2] of positions) {
			if(key1 < key2) {
				const x1 = pos1.x, y1 = pos1.y
				const x2 = pos2.x, y2 = pos2.y
				const hypot = Math.hypot(x2-x1,y2-y1)
				const cx = hypot == 0 ? 0.5 : (x2-x1)/hypot
				const cy = hypot == 0 ? 0.5 : (y2-y1)/hypot
				const speed = Math.min(hypot-radialLength,0)*radialStrength
				const velocity1 = velocities.get(key1)
				const velocity2 = velocities.get(key2)
				velocity1.x += speed*cx
				velocity1.y += speed*cy
				velocity2.x -= speed*cx
				velocity2.y -= speed*cy
			}
		}
	}
}

function applyLayerForce(positions, velocities, layers, layerStart, layerSeparation, layerStrength) {
	for(const [key,pos] of positions) {
		const layerX = layers.get(key)*layerSeparation+layerStart
		const distance = layerX-pos.x
		const speed = distance*layerStrength
		const velocity = velocities.get(key)
		velocity.x += speed
	}
}

function GraphView({
	nodes,
	links,
	root,

	linkStrength = 1,

	radialLength = 200,
	radialStrength = 10,

	layerStart = 600,
	layerSeparation = 250,
	layerStrength = 5
}) {

	const [inLists, outLists] = useMemo(() => getAdjacencyLists(nodes,links), [nodes, links])
	const layers = useMemo(() => getLayers(inLists, outLists, root), [inLists, outLists, root])

	const [origin, setOrigin] = useState({ x: 0, y: 0 })
  const [positions, setPositions] = useState(new Map(
		Array.from(nodes.keys(), key => [key,{x:Math.random()*10, y:Math.random()*10}])
	))

	const animationRequest = useRef()
	const animationTime = useRef()

	const mouseMoveListener = useRef()
	const mouseLeaveListener = useRef()
	const mouseUpListener = useRef()

	const mouseDown = useRef(false)
	const dragStart = useRef()

	const alphaNode = useRef()
	const alphaStart = useRef()

	const NodeViews = Array.from(nodes, ([key,node],_) => {
		const pos = positions.get(key)
		const x = pos.x-origin.x, y = pos.y-origin.y
		const handleMouseDownAlpha = (e) => {
			e.preventDefault()
			alphaNode.current = key	
			alphaStart.current = { x: pos.x-e.clientX, y: pos.y-e.clientY }
		}
		return (
			<NodeView key={key} x={x} y={y} onMouseDown={handleMouseDownAlpha} >
				{node.content}
			</NodeView>
		)
	})

	const LinkViews = Array.from(links, ([key,link],_) => {
		const pos1 = positions.get(link.a)
		const pos2 = positions.get(link.b)
		const x1 = pos1.x-origin.x, y1 = pos1.y-origin.y
		const x2 = pos2.x-origin.x, y2 = pos2.y-origin.y
		return (
			<LinkView key={key} x1={x1} y1={y1} x2={x2} y2={y2} r={90} />
		)
	})

	function update() {
		setPositions(positions => {

			const velocities = new Map(
				Array.from(nodes, ([key,node],id) => [key,{x:0, y:0}])
			)

			applyLinkForce(positions, velocities, links, linkStrength)
			applyRadialForce(positions, velocities, radialLength, radialStrength)
			applyLayerForce(
				positions,
				velocities,
				layers,
				layerStart,
				layerSeparation,
				layerStrength
			)

			return new Map(Array.from(positions, ([key,position],_) => {
				if(mouseDown.current && key == alphaNode.current) {
					return [key, {x:position.x, y:position.y}]
				}
				const velocity = velocities.get(key)
				return [key, {x:position.x + velocity.x/100, y:position.y + velocity.y/100}]
			}))
		})
		animationRequest.current = requestAnimationFrame(update)
	}

	function handleMouseDown(e) {
		mouseDown.current = true
		dragStart.current = { x: origin.x+e.clientX, y: origin.y+e.clientY }
	}

	function handleMouseMove(e) {
		if(mouseDown.current) {
			const alpha = alphaNode.current // alphaNode.current can become undefined
			if(alpha == undefined) {
				setOrigin({ x: dragStart.current.x-e.clientX, y: dragStart.current.y-e.clientY })
			}
			else {
				setPositions(positions => {
					const newPositions = new Map(positions)
					const alphaX = alphaStart.current.x+e.clientX
					const alphaY = alphaStart.current.y+e.clientY
					newPositions.set(alpha,{x:alphaX,y:alphaY})
					return newPositions
				})
			}
		}
	}

	function handleMouseLeave(e) {
		mouseDown.current = false
		alphaNode.current = undefined
	}

	function handleMouseUp(e) {
		mouseDown.current = false
		alphaNode.current = undefined
	}

	useEffect(() => {
		animationRequest.current = requestAnimationFrame(update)
		mouseMoveListener.current = addEventListener("mousemove", handleMouseMove)
		mouseLeaveListener.current = addEventListener("mouseleave", handleMouseLeave)
		mouseUpListener.current = addEventListener("mouseup", handleMouseUp)
		return () => {
			cancelAnimationFrame(animationRequest.current)
			removeEventListener("mousemove", mouseMoveListener.current)
			removeEventListener("mouseleave", mouseLeaveListener.current)
			removeEventListener("mouseup", mouseUpListener.current)
		}
	}, [])

	return (
		<div
			className="graph"
			onMouseDown={handleMouseDown}
			style={mouseDown.current ? {cursor:"grabbing"} : {}}
		>
			<svg className="link-nest" >
				<filter id="glow">
					<feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="white" />
				</filter>
				<rect x="0" y="0" width="100000" height="100000" strokeWidth="0" fill="#112" />
				{LinkViews}
			</svg>
			<div className="node-nest">
				{NodeViews}
			</div>
    </div>
  )
}

export default GraphView
